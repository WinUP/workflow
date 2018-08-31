import { ConflictError, UnavailableError, GeneratorError } from './errors';
import { IWorkflow, IRelation } from './Definition';
import { ProducerActivator } from './ProducerActivator';
import { IWorkflowOptions } from './IWorkflowOptions';
import { WorkflowContext } from './WorkflowContext';
import { IWorkflowResult } from './IWorkflowResult';
import { IProduceResult } from './ProduceResult';
import { Producer } from './Producer';
import { Relation } from './Relation';

type RunningItem = IProduceResult & { inject: { [key: string]: any } };

/**
 * Workflow manager handles one workflow's status and may also stores workflow definition or just user other
 * workflow manager's definition
 */
export class WorkflowManager {
    private _entrance: Producer | undefined;
    private _output: Producer | undefined;
    private _isRunning: boolean = false;
    private _finishedNodes: string[] = [];
    private _skippedNodes: string[] = [];
    private stopInjector: (() => void) | undefined;
    private pauseInjector: (() => void) | undefined;
    private pendingCallback: Promise<void> | undefined;
    private pendingTrigger: (() => void) | undefined;

    /**
     * If this field is not undefined, workflow manager will send each producer's result after their running
     */
    public resultObserver: ((result: IProduceResult<any>) => void) | undefined;

    /**
     * Workflow's entrance producer. When call ```run()``` function, this should be the first one to execute.
     */
    public get entrance(): Producer | undefined {
        if (this._isRunning) {
            throw new ConflictError('Cannot set entrance when workflow is running');
        }
        return this._entrance;
    } public set entrance(value) {
        this._entrance = value;
    }

    /**
     * Output producer. If not set, workflow will return all producer's output data after run.
     */
    public get output(): Producer | undefined {
        if (this._isRunning) {
            throw new ConflictError('Cannot set output point when workflow is running');
        }
        return this._output;
    } public set output(value) {
        this._output = value;
    }

    /**
     * Indicate if workflow is running
     */
    public get isRunning(): boolean {
        return this._isRunning;
    }

    /**
     * Get all node ids that skipped in running
     */
    public get skipped(): ReadonlyArray<string> {
        return this._skippedNodes;
    }

    /**
     * Get all node ids that finished in running
     */
    public get finished(): ReadonlyArray<string> {
        return this._finishedNodes;
    }

    /**
     * Validate current workflow to find any unreachable producers. This cannot judge output node.
     */
    public get unreachableNodes(): Producer[] {
        if (this._entrance) {
            const reachable: Producer[] = [this._entrance];
            const allNode: Producer[] = [];
            this.generateMap(this._entrance, 'down', reachable, allNode);
            return allNode.filter(node => !reachable.includes(node));
        } else {
            return [];
        }
    }

    /**
     * Default avtivator when no activator given in ```fromDefinitions```
     */
    public static defaultActivator: ProducerActivator | undefined = undefined;

    /**
     * Load workflow from definition by using default activator
     * @param definitions All workflow definitions
     */
    public static fromDefinitions(...definitions: IWorkflow[]): WorkflowManager;
    /**
     * Load workflow from definitions
     * @param activator A function that using given type string and return an instance of ```Producer```
     * or ```undefined``` (if cannot instancing ```Producer```)
     * @param definitions All workflow definitions
     */
    public static fromDefinitions(activator: ProducerActivator, ...definitions: IWorkflow[]): WorkflowManager;
    public static fromDefinitions(...params: (IWorkflow | ProducerActivator)[]): WorkflowManager {
        const { activator, definitions } = WorkflowManager.getDefinition(params);
        const producers: Producer[] = [];
        const relations: IRelation[] = [];
        let entranceId: string | undefined;
        let outputId: string | undefined;
        definitions.forEach(definition => {
            if (definition.entrance) {
                if (entranceId) {
                    throw new GeneratorError(`Cannot set ${definition.entrance} as entrance which had already set to ${entranceId}`);
                }
                entranceId = definition.entrance;
            }
            if (definition.output) {
                if (outputId) {
                    throw new GeneratorError(`Cannot set ${definition.output} as output point which had already set to ${outputId}`);
                }
                outputId = definition.output;
            }
            if (definition.producers) {
                definition.producers.forEach(producer => {
                    if (producers.some(p => p.id === producer.id)) {
                        throw new GeneratorError(`ID "${producer.id}" conflict`);
                    }
                    const instanceActivator = activator(producer.type);
                    if (!instanceActivator) {
                        throw new GeneratorError(`Activator for type "${producer.type}" (on "${producer.id}") returns nothing`);
                    }
                    const instance = new instanceActivator(producer.id);
                    instance.initialize(producer.parameters);
                    instance.runningDelay = producer.runningDelay || 0;
                    instance.replyDelay = producer.replyDelay || 0;
                    producers.push(instance);
                });
            }
            if (definition.relations) {
                definition.relations.forEach(relation => {
                    if (relations.some(r => r.from === relation.from && r.to === relation.to)) {
                        throw new GeneratorError(`Relation ${relation.from} -> ${relation.to} is already existed`);
                    }
                    relations.push(relation);
                });
            }
        });
        const entrance = producers.find(p => p.id === entranceId);
        if (!entrance) {
            throw new GeneratorError(`No entrance point (prefer id ${entranceId})`);
        }
        relations.forEach(relation => {
            const from = producers.find(p => p.id === relation.from);
            const to = producers.find(p => p.id === relation.to);
            if (!from) {
                throw new GeneratorError(`Relation ${relation.from} (nonexisted) -> ${relation.to} is not available`);
            }
            if (!to) {
                throw new GeneratorError(`Relation ${relation.from} -> ${relation.to} (nonexisted) is not available`);
            }
            Relation.create(from, to, relation.inject, relation.condition || undefined, relation.allowEmptyInput);
        });
        const result = new WorkflowManager();
        result.entrance = entrance;
        if (outputId) {
            const output = producers.find(p => p.id === outputId);
            if (!output) {
                throw new GeneratorError(`Unexisted output point (prefer id ${outputId})`);
            }
            result.output = output;
        }
        return result;
    }

    /**
     * Stop workflow. Workflow will not stop immediately but stop before process next ```Producer```,
     * current running ```Producer``` cannot be stopped.
     * @throws {UnavailableError} Workflow is not running.
     * @throws {ConflictError} Workflow is in stopping progress.
     */
    public async stop(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this._isRunning && this.stopInjector == null) {
                this.stopInjector = () => resolve();
                if (this.pendingTrigger != null) {
                    this.resume();
                }
            } else if (!this._isRunning) {
                reject(new UnavailableError('Workflow is not running'));
            } else {
                reject(new ConflictError('Workflow is in stopping progress'));
            }
        });
    }

    /**
     * Pause workflow. Workflow will not pause immediately but pause before process next ```Producer```,
     * current running ```Producer``` will continue run until it finished.
     * @throws {UnavailableError} Workflow is not running.
     * @throws {ConflictError} Workflow is in pausing progress.
     */
    public async pause(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this._isRunning && this.pauseInjector == null) {
                this.pauseInjector = () => resolve();
                this.pendingCallback = new Promise<void>(callback => { this.pendingTrigger = () => callback(); });
            } else if (!this._isRunning) {
                reject(new UnavailableError('Workflow is not running'));
            } else {
                reject(new ConflictError('Workflow is in pausing progress'));
            }
        });
    }

    /**
     * Resume workflow.
     * @throws {UnavailableError} Workflow is not running or not paused.
     */
    public resume(): void {
        if (this._isRunning && this.pendingTrigger != null) {
            this.pendingTrigger();
            this.pendingTrigger = undefined;
        } else if (!this._isRunning) {
            throw new UnavailableError('Workflow is not running');
        } else {
            throw new UnavailableError('Workflow is not paused');
        }
    }

    /**
     * Run this workflow
     * @param input Input data
     * @param env Environment parameters, default is empty object
     * @returns An array contains each ```Producer```'s result if no output set, regurally last one is the last ```Producer```'s result.
     * If ```this.output``` is not null, this array will only contains ```this.output```'s result.
     * @description If ```this.output``` is not null, algorithm will release memory when any ```Producer```'s data is not
     * useful, typically it can highly reduce memory usage.
     */
    public async run<T extends { [key: string]: any } = any>(input: any, env?: T, options: IWorkflowOptions = {})
        : Promise<IWorkflowResult> {
        if (this._entrance == null) {
            throw new UnavailableError('Workflow has no entrance point');
        }
        if (this._isRunning) {
            throw new ConflictError('Workflow is already running');
        }
        if (options.singleInput) {
            input = [input];
        } else if (!(input instanceof Array)) {
            throw new TypeError('When options.singleInput is not true, input data must be an array');
        }
        let running: RunningItem[] = [{ producer: this._entrance, data: input, inject: {} }]; // 需要被执行的处理器
        this._finishedNodes = [];
        this._skippedNodes = [];
        const finished: Producer[] = []; // 已执行完成的处理器
        const skipped: Producer[] = []; // 需要被跳过的处理器
        const dataPool: IProduceResult<any>[] = []; // 每个处理器的结果
        const needClean: Producer[] = []; // 待清理的处理器
        const context = new WorkflowContext(); // 工作流参数
        context.dataPool = dataPool;
        context.finished = finished;
        context.skipped = skipped;
        context.environment = env || {};
        this._isRunning = true;
        while (running.length > 0) {
            const nextRound: RunningItem[] = [], activeItem: RunningItem[] = [];
            if (this.pauseInjector) { // 在每个循环开始时处理暂停
                this.pauseInjector();
                this.pauseInjector = undefined;
                await this.pendingCallback;
                this.pendingCallback = undefined;
            }
            if (this.stopInjector) { // 在每个循环开始时确定是否被终止，此时直接跳出循环，running长度一定为0
                this.stopInjector();
                break;
            }
            // 寻找可执行节点
            for (let i = -1, length = running.length; ++i < length;) {
                const runner = running[i];
                // 仅执行：目标节点不在下一轮执行队列中，目标节点满足执行前提
                if (!nextRound.some(r => r.producer === runner.producer) && runner.producer.fitCondition(finished, skipped)) {
                    activeItem.push(runner);
                } else {
                    // 不执行则只做执行队列去重（数据合并），上述需要执行的情况在处理子节点时自带去重
                    const existedRunner = nextRound.find(r => r.producer === runner.producer);
                    if (existedRunner) {
                        existedRunner.data = existedRunner.data.concat(runner.data);
                        existedRunner.inject = { ...existedRunner.inject, ...runner.inject };
                    } else {
                        nextRound.push(runner);
                    }
                }
            }
            let innerError: Error | undefined = undefined, isFinished: boolean = false;
            // 并行执行所有可执行节点。不需担心关系检索，工作器执行结束到关系判定结束之间没有异步代码。
            await Promise.all(activeItem.map(async runner => {
                if (innerError) { return; }
                let data: any[] | undefined;
                try {
                    data = await runner.producer.prepareExecute(runner.data, runner.inject, context);
                } catch (e) {
                    innerError = e instanceof Error ? e : new Error(e);
                } finally {
                    data = data || [];
                }
                if (innerError) { return; }
                finished.push(runner.producer); // 标记执行完成
                if (this._output && runner.producer !== this._output) { needClean.push(runner.producer); } // 标记待清理
                this._finishedNodes.push(runner.producer.id);
                const runningResult = { producer: runner.producer, data: data };
                dataPool.push(runningResult); // 记录执行结果
                if (this.resultObserver) { this.resultObserver(runningResult); } // 如有必要发送执行结果
                if (runner.producer === this._output && !isFinished) { // 如果已经到达终点则直接跳出执行队列
                    isFinished = true;
                    dataPool.splice(0, dataPool.length - 2);
                    running = [];
                    return;
                }
                if (context.cancelled) { // 如果被取消
                    return this.stop();
                }
                // 处理所有子节点
                for (let i = -1, length = runner.producer.children.length; ++i < length;) {
                    const child = runner.producer.children[i];
                    const suitableResult = data.filter(r => child.judge(r)); // 只放入通过条件判断的数据
                    if (suitableResult.length > 0 || child.allowEmptyInput) {
                        // 从下一轮执行队列中寻找目标节点
                        let newRunner = nextRound.find(r => r.producer === child.to);
                        if (!newRunner) { // 没有则新建执行要求
                            newRunner = { producer: child.to, data: [], inject: {} };
                            nextRound.push(newRunner);
                        }
                        if (child.inject) { // 参数注入情况
                            newRunner.inject[child.inject] = suitableResult[0];
                        } else { // 普通数据传递
                            newRunner.data = newRunner.data.concat(suitableResult);
                        }
                    } else if (!(running.some(p => p.producer === child.to) || nextRound.some(p => p.producer === child.to))
                        && child.to.parents.every(v => finished.includes(v.from) || skipped.includes(v.from))) {
                        this.skipProducer(child.to, skipped); // 全部数据均不满足条件时视为跳过目标节点
                    }
                }
            }));
            if (innerError) { throw innerError; }
            /// 如果设置终点则回收内存（确保不将全部数据清除，因为可能存在没有运行到最后的工作流）
            if (this._output) {
                let i: number = 0;
                while (i < needClean.length && dataPool.length > 1) {
                    const producer = needClean[i];
                    if (producer.children.every(v => finished.includes(v.to) || skipped.includes(v.to))) {
                        const index = dataPool.findIndex(v => v.producer === producer);
                        if (index > -1) {
                            dataPool.splice(index, 1);
                        }
                        needClean.splice(i, 1);
                    } else {
                        ++i;
                    }
                }
            }
            running = nextRound;
        }
        const result = {
            data: options.returnLast ? dataPool.slice(dataPool.length - 1) : dataPool,
            finished: this.stopInjector == null
        };
        this.stopInjector = undefined;
        this._isRunning = false;
        return result;
    }

    /**
     * Create a new ```WorkflowManager``` that shares workflow definition with current instance but has its own running status
     * @description This means that new manager and this instance targeting same workflow definition (same entrance, same output, etc),
     * which means if any producer in workflow definition does not support multi-thread environment (like promise), both manager's
     * running results may contain error.
     */
    public shallowClone(): WorkflowManager {
        const result = new WorkflowManager();
        result._entrance = this._entrance;
        result._output = this._output;
        return result;
    }

    private generateMap(entrance: Producer, searchDirection: 'up' | 'down' | 'both', touchable: Producer[], allNode: Producer[]): void {
        if (!allNode.includes(entrance)) {
            allNode.push(entrance);
        }
        if (searchDirection === 'down' || searchDirection === 'both') {
            entrance.children.filter(child => !touchable.includes(child.to)).forEach(child => {
                touchable.push(child.to);
                this.generateMap(child.to, 'both', touchable, allNode);
            });
        }
        if (searchDirection === 'up' || searchDirection === 'both') {
            entrance.parents.forEach(parent => {
                this.generateMap(parent.from, 'up', touchable, allNode);
            });
        }
    }

    private skipProducer(target: Producer, skipped: Producer[]): void {
        skipped.push(target);
        this._skippedNodes.push(target.id);
        for (let i = -1, length = target.children.length; ++i < length;) {
            const child = target.children[i];
            if (child.to.parents.every(p => skipped.includes(p.from))) {
                this.skipProducer(child.to, skipped);
            }
        }
    }

    private static getDefinition(definitions: (IWorkflow | ProducerActivator)[])
        : { activator: ProducerActivator, definitions: IWorkflow[] } {
        if (definitions.length < 1) {
            throw new GeneratorError(`Must have at least one definition`);
        }
        if (typeof definitions[0] === 'function') {
            const activator: ProducerActivator = definitions[0] as ProducerActivator;
            definitions.splice(0, 1);
            if (definitions.length < 1) {
                throw new GeneratorError(`Must have at least one definition`);
            }
            return { activator: activator, definitions: definitions as IWorkflow[] };
        } else {
            if (!this.defaultActivator) {
                throw new GeneratorError(`No activator or default activator provided`);
            }
            return { activator: this.defaultActivator, definitions: definitions as IWorkflow[] };
        }
    }
}
