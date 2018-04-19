import { WorkflowDefinition, RelationDefinition } from './Definition';
import { ProduceResult } from './ProduceResult';
import { asPromise } from './util';
import { Producer } from './Producer';
import { Relation } from './Relation';
import * as Errors from './errors';

/**
 * Workflow manager
 */
export class WorkflowManager {
    private _entrance: Producer | null = null;
    private _output: Producer | null = null;
    private _isRunning: boolean = false;
    private _finishedNodes: string[]  = [];
    private _skippedNodes: string[]  = [];
    private stopInjector: (() => void) | null = null;
    private pauseInjector: (() => void) | null = null;
    private pendingCallback: Promise<void> | null = null;
    private pendingTrigger: (() => void) | null = null;

    /**
     * Entrance producer
     */
    public get entrance(): Producer | null {
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
    public get output(): Producer | null {
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
     * Validate current workflow to find any unreachable producers.
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
     * Load workflow fronm definitions
     * @param activator A function that using given type string and return an instance of ```Producer```
     * or ```null``` (if cannot instancing ```Producer```)
     * @param definitions All workflow definitions
     */
    public static fromDefinitions(activator: (type: string) => ((new (id?: string) => Producer) | null),
        ...definitions: WorkflowDefinition[]): WorkflowManager {
        const producers: Producer[] = [];
        const relations: RelationDefinition[] = [];
        let entranceId: string | null = null;
        definitions.forEach(definition => {
            if (definition.entrance) {
                if (entranceId) {
                    throw new Errors.ConflictError(
                        `Cannot set ${definition.entrance} as entrance point: Entrance has already set to ${entranceId}`
                    );
                }
                entranceId = definition.entrance;
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
            from!.relation(new Relation(from, to, relation.inject, relation.condition || undefined));
        });
        const result = new WorkflowManager();
        result.entrance = entrance;
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
            this.pendingTrigger = null;
        } else if (!this._isRunning) {
            throw new Errors.UnavailableError('Workflow is not running');
        } else {
            throw new Errors.UnavailableError('Workflow is not paused');
        }
    }

    /**
     * Run this workflow
     * @param input Input data
     * @returns An array contains each ```Producer```'s result if no output set, regurally last one is the last ```Producer```'s result.
     * If ```this.output``` is not null, this array will only contains ```this.output```'s result.
     * @description If ```this.output``` is not null, algorithm will release memory when any ```Producer```'s data is not
     * useful, typically it can highly reduce memory usage.
     */
    public async run<T, U = T>(input: T): Promise<{ data: ProduceResult<U>[], finished: boolean }> {
        if (this._entrance == null) {
            throw new Errors.UnavailableError('Cannot run workflow: No entrance point');
        }
        if (this._isRunning) {
            throw new Errors.ConflictError('Workflow is already running');
        }
        let running: (ProduceResult<any[]> & { inject: { [key: string]: any } })[]
            = [{producer: this._entrance, data: [input], inject: {} }]; // 需要被执行的处理器
        this._finishedNodes = [];
        this._skippedNodes = [];
        const finished: Producer[] = []; // 已执行完成的处理器
        const skipped: Producer[] = []; // 需要被跳过的处理器
        const dataPool: ProduceResult<any>[] = []; // 每个处理器的结果
        const needClean: Producer[] = []; // 待清理的处理器
        this._isRunning = true;
        while (running.length > 0) {
            const nextRound: (ProduceResult<any[]> & { inject: { [key: string]: any } })[] = [];
            for (let i = 0; i < running.length; i++) {
                if (this.pauseInjector) { // 在每个循环开始时处理暂停
                    this.pauseInjector();
                    this.pauseInjector = null;
                    await this.pendingCallback;
                    this.pendingCallback = null;
                }
                if (this.stopInjector) { // 在每个循环开始时确定是否被终止，此时直接跳出循环，running长度一定为0
                    this.stopInjector();
                    break;
                }
                const runner = running[i];
                // 仅执行：目标节点不在下一轮执行队列中，目标节点满足执行前提
                if (!nextRound.some(r => r.producer === runner.producer) && runner.producer.fitCondition(finished, skipped)) {
                    let error: Error | null = null;
                    const data: any[] = await asPromise<any[]>(runner.producer.produce(runner.data, runner.inject)).catch(e => error = e);
                    if (error) { throw error; }
                    finished.push(runner.producer); // 标记执行完成
                    if (this._output && runner.producer !== this._output) { needClean.push(runner.producer); } // 标记待清理
                    this._finishedNodes.push(runner.producer.id);
                    dataPool.push({ producer: runner.producer, data: data }); // 记录执行结果
                    // 处理所有子节点
                    runner.producer.children.forEach(child => {
                        const suitableResult = data.filter(r => child.judge(r));
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
                        } else {
                            // 满足条件的数据不存在视为跳过目标节点
                            this.skipProducer(child.to, skipped);
                        }
                    });
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
        this.stopInjector = null;
        this._isRunning = false;
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
}
