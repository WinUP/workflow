import { WorkflowDefinition, RelationDefinition } from './Definition';
import { WorkflowEventArgs } from './WorkflowEventArgs';
import { ProducerActivator } from './ProducerActivator';
import { WorkflowResult } from './WorkflowResult';
import { ProduceResult } from './ProduceResult';
import { asPromise } from './Utilities';
import { Producer } from './Producer';
import { Relation } from './Relation';
import * as Errors from './errors';

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
    public resultObserver: ((result: ProduceResult<any>) => void) | undefined;

    /**
     * Workflow's entrance producer. When call ```run()``` function, this should be the first one to execute.
     */
    public get entrance(): Producer | undefined {
        if (this._isRunning) {
            throw new Errors.ConflictError('Workflow is running');
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
            throw new Errors.ConflictError('Workflow is running');
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
    public static fromDefinitions(...definitions: WorkflowDefinition[]): WorkflowManager;
    /**
     * Load workflow from definitions
     * @param activator A function that using given type string and return an instance of ```Producer```
     * or ```undefined``` (if cannot instancing ```Producer```)
     * @param definitions All workflow definitions
     */
    public static fromDefinitions(activator: ProducerActivator, ...definitions: WorkflowDefinition[]): WorkflowManager;
    public static fromDefinitions(...params: (WorkflowDefinition | ProducerActivator)[]): WorkflowManager {
        const { activator, definitions } = WorkflowManager.getDefinition(params);
        const producers: Producer[] = [];
        const relations: RelationDefinition[] = [];
        let entranceId: string | undefined;
        let outputId: string | undefined;
        definitions.forEach(definition => {
            if (definition.entrance) {
                if (entranceId) {
                    throw new Errors.ConflictError(
                        `Cannot set ${definition.entrance} as entrance point: Entrance had already set to ${entranceId}`
                    );
                }
                entranceId = definition.entrance;
            }
            if (definition.output) {
                if (outputId) {
                    throw new Errors.ConflictError(
                        `Cannot set ${definition.output} as output point: Output had already set to ${outputId}`
                    );
                }
                outputId = definition.entrance;
            }
            if (definition.producers) {
                definition.producers.forEach(producer => {
                    if (producers.some(p => p.id === producer.id)) {
                        throw new Errors.ConflictError(`Cannot add producer ${producer.id}: Id conflict`);
                    }
                    const instanceActivator = activator(producer.type);
                    if (!instanceActivator) {
                        throw new TypeError(`Cannot declare producer ${producer.id}: Activator returns nothing`);
                    }
                    const instance = new instanceActivator(producer.id);
                    instance.initialize(producer.parameters);
                    producers.push(instance);
                });
            }
            if (definition.relations) {
                definition.relations.forEach(relation => {
                    if (relations.some(r => r.from === relation.from && r.to === relation.to)) {
                        throw new Errors.ConflictError(`Cannot register relation: ${relation.from} -> ${relation.to} is already exist`);
                    }
                    relations.push(relation);
                });
            }
        });
        const entrance = producers.find(p => p.id === entranceId);
        if (!entrance) {
            throw new ReferenceError(`Cannot generate workflow: No entrance point (prefer id ${entranceId})`);
        }
        relations.forEach(relation => {
            const from = producers.find(p => p.id === relation.from);
            if (!from) {
                throw new ReferenceError(
                    `Cannot add relation ${relation.from} -> ${relation.to}: Parent with id ${relation.from} is not exist`);
            }
            const to = producers.find(p => p.id === relation.to);
            if (!to) {
                throw new ReferenceError(
                    `Cannot add relation ${relation.from} -> ${relation.to}: Child with id ${relation.to} is not exist`);
            }
            Relation.create(from, to, relation.inject, relation.condition || undefined);
        });
        const result = new WorkflowManager();
        result.entrance = entrance;
        if (outputId) {
            const output = producers.find(p => p.id === outputId);
            if (!output) {
                throw new ReferenceError(`Cannot generate workflow: Unexisted output point (prefer id ${outputId})`);
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
                reject(new Errors.UnavailableError('Workflow is not running'));
            } else {
                reject(new Errors.ConflictError('Workflow is in stopping progress'));
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
                reject(new Errors.UnavailableError('Workflow is not running'));
            } else {
                reject(new Errors.ConflictError('Workflow is in pausing progress'));
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
            throw new Errors.UnavailableError('Workflow is not running');
        } else {
            throw new Errors.UnavailableError('Workflow is not paused');
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
    public async run<T, U extends { [key: string]: any } = any>(input: T, env?: U): Promise<WorkflowResult> {
        if (this._entrance == null) {
            throw new Errors.UnavailableError('Cannot run workflow: No entrance point');
        }
        if (this._isRunning) {
            throw new Errors.ConflictError('Workflow is already running');
        }
        let running: (ProduceResult<any[]> & { inject: { [key: string]: any } })[]
            = [{ producer: this._entrance, data: [input], inject: {} }]; // 需要被执行的处理器
        this._finishedNodes = [];
        this._skippedNodes = [];
        const finished: Producer[] = []; // 已执行完成的处理器
        const skipped: Producer[] = []; // 需要被跳过的处理器
        const dataPool: ProduceResult<any>[] = []; // 每个处理器的结果
        const needClean: Producer[] = []; // 待清理的处理器
        const args = new WorkflowEventArgs(); // 工作流参数
        args.dataPool = dataPool;
        args.finished = finished;
        args.skipped = skipped;
        args.environment = env || {};
        this._isRunning = true;
        while (running.length > 0) {
            const nextRound: (ProduceResult<any[]> & { inject: { [key: string]: any } })[] = [];
            for (let i = -1; ++i < running.length;) {
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
                const runner = running[i];
                // 仅执行：目标节点不在下一轮执行队列中，目标节点满足执行前提
                if (!nextRound.some(r => r.producer === runner.producer) && runner.producer.fitCondition(finished, skipped)) {
                    let error: Error | null = null;
                    const data: any[] = await asPromise<any[]>(runner.producer.prepareExecute(runner.data, runner.inject, args))
                        .catch(e => error = e);
                    if (error) { throw error; }
                    finished.push(runner.producer); // 标记执行完成
                    if (this._output && runner.producer !== this._output) { needClean.push(runner.producer); } // 标记待清理
                    this._finishedNodes.push(runner.producer.id);
                    const runningResult = { producer: runner.producer, data: data };
                    dataPool.push(runningResult); // 记录执行结果
                    if (this.resultObserver) { this.resultObserver(runningResult); } // 如有必要发送执行结果
                    if (runner.producer === this._output) { // 如果已经到达终点则直接跳出执行队列
                        dataPool.splice(0, dataPool.length - 2);
                        running = [];
                        break;
                    }
                    if (args.cancelled) { // 如果被取消
                        this.stop();
                    }
                    // 处理所有子节点
                    for (let j = -1; ++j < runner.producer.children.length;) {
                        const child = runner.producer.children[j];
                        const suitableResult = data.filter(r => child.judge(r)); // 只放入通过条件判断的数据
                        if (suitableResult.length > 0) {
                            // 从下一轮执行队列中寻找目标节点
                            let newRunner = nextRound.find(r => r.producer === child.to);
                            if (!newRunner) { // 没有则新建执行要求
                                newRunner = { producer: child.to, data: [], inject: {} };
                                nextRound.push(newRunner);
                            }
                            if (child.inject) { // 参数注入情况
                                newRunner.inject[child.inject] = suitableResult[0];
                            } else { // 普通数据传递
                                newRunner.data = [...newRunner.data, ...suitableResult];
                            }
                        } else if (!(running.some(p => p.producer === child.to) || nextRound.some(p => p.producer === child.to))
                            && child.to.parents.every(v => finished.includes(v.from) || skipped.includes(v.from))) {
                            this.skipProducer(child.to, skipped); // 全部数据均不满足条件时视为跳过目标节点
                        }
                    }
                } else {
                    // 不执行则只做执行队列去重（数据合并），上述需要执行的情况在处理子节点时自带去重
                    const existedRunner = nextRound.find(r => r.producer === runner.producer);
                    if (existedRunner) {
                        existedRunner.data = [...existedRunner.data, ...runner.data];
                        existedRunner.inject = { ...existedRunner.inject, ...runner.inject };
                    } else {
                        nextRound.push(runner);
                    }
                }
            }
            /// 如果设置终点则回收内存
            if (this._output) {
                let i: number = 0;
                while (i < needClean.length) {
                    const producer = needClean[i];
                    if (producer.children.every(v => finished.includes(v.to) || skipped.includes(v.to))) {
                        const index = dataPool.findIndex(v => v.producer === producer);
                        if (index > -1) {
                            dataPool.splice(index, 1);
                        }
                        needClean.splice(i, 1);
                    } else {
                        i++;
                    }
                }
            }
            running = nextRound;
        }
        const result = { data: dataPool, finished: this.stopInjector == null };
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
        target.children.forEach(child => {
            if (child.to.parents.every(p => skipped.includes(p.from))) {
                this.skipProducer(child.to, skipped);
            }
        });
    }

    private static getDefinition(definitions: (WorkflowDefinition | ProducerActivator)[])
        : { activator: ProducerActivator, definitions: WorkflowDefinition[] } {
        if (definitions.length < 1) {
            throw new TypeError(`Cannot create workflow: Must have at least one definition`);
        }
        if (typeof definitions[0] === 'function') {
            const activator: ProducerActivator = definitions[0] as ProducerActivator;
            definitions.splice(0, 1);
            if (definitions.length < 1) {
                throw new TypeError(`Cannot create workflow: Must have at least one definition`);
            }
            return { activator: activator, definitions: definitions as WorkflowDefinition[] };
        } else {
            if (!this.defaultActivator) {
                throw new TypeError(`Cannot create workflow: No activator or default activator provided`);
            }
            return { activator: this.defaultActivator, definitions: definitions as WorkflowDefinition[] };
        }
    }
}
