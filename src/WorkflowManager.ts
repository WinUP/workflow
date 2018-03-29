import { WorkflowDefinition, RelationDefinition } from './Definition';
import { ProduceResult } from './ProduceResult';
import { Producer } from './Producer';
import { Relation } from './Relation';
import { asPromise } from './util';

/**
 * Workflow manager
 */
export class WorkflowManager {
    private _entrance: Producer | null = null;

    /**
     * Entrance producer
     */
    public get entrance(): Producer | null {
        return this._entrance;
    } public set entrance(value) {
        this._entrance = value;
    }

    /**
     * Load workflow fronm definitions
     * @param activator A function that using given type string and return an instance of Producer or null (if cannot declare producer)
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
                    throw new TypeError(`Cannot set ${definition.entrance} as entrance point: Entrance has already set to ${entranceId}`);
                }
                entranceId = definition.entrance;
            }
            if (definition.producers) {
                definition.producers.forEach(producer => {
                    if (producers.some(p => p.id === producer.id)) {
                        throw new TypeError(`Cannot add producer ${producer.id}: Id conflict`);
                    }
                    const instanceActivator = activator(producer.type);
                    if (!instanceActivator) {
                        throw new ReferenceError(`Cannot declare producer ${producer.id}: Activator returns nothing`);
                    }
                    const instance = new instanceActivator(producer.id);
                    instance.initialize(producer.parameters);
                    producers.push(instance);
                });
            }
            if (definition.relations) {
                definition.relations.forEach(relation => {
                    if (relations.some(r => r.from === relation.from && r.to === relation.to)) {
                        throw new TypeError(`Cannot register relation: ${relation.from} -> ${relation.to} is already exist`);
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
     * Run this workflow
     * @param input Input data
     * @returns An array contains each producer's result. Regurally last one is the last producer's result.
     */
    public async run<T, U = T>(input: T): Promise<ProduceResult<U>[]> {
        if (this._entrance == null) {
            throw new ReferenceError('Cannot run workflow: No entrance point');
        }
        let running: (ProduceResult<any[]> & { inject: { [key: string]: any } })[]
            = [{producer: this._entrance, data: [input], inject: {} }]; // 需要被执行的处理器
        const finished: Producer[] = []; // 已执行完成的处理器
        const skipped: Producer[] = []; // 需要被跳过的处理器
        const dataPool: ProduceResult<any>[] = []; // 每个处理器的结果
        while (running.length > 0) {
            const nextRound: (ProduceResult<any[]> & { inject: { [key: string]: any } })[] = [];
            for (let i = 0; i < running.length; i++) {
                const runner = running[i];
                // 仅执行：目标节点不在下一轮执行队列中，目标节点满足执行前提
                if (!nextRound.some(r => r.producer === runner.producer) && runner.producer.fitCondition(finished, skipped)) {
                    let error: Error | null = null;
                    const result: any[] = await asPromise<any[]>(runner.producer.produce(runner.data, runner.inject)).catch(e => error = e);
                    if (error) { throw error; }
                    finished.push(runner.producer); // 标记执行完成
                    dataPool.push({ producer: runner.producer, data: result }); // 记录执行结果
                    // 处理所有子节点
                    runner.producer.children.forEach(child => {
                        const suitableResult = result.filter(r => child.judge(r));
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
                            WorkflowManager.skipProducer(child.to, skipped);
                        }
                    });
                } else {
                    // 不执行则只做执行队列去重（数据合并），上述需要执行的情况在处理子节点时自带去重
                    const existedRunner = nextRound.find(r => r.producer === runner.producer);
                    if (existedRunner) {
                        existedRunner.data = [...existedRunner.data, ...runner.data];
                    } else {
                        nextRound.push(runner);
                    }
                }
            }
            running = nextRound;
        }
        return dataPool;
    }

    /**
     * Validate current workflow to find any unreachable producer
     */
    public validate(): Producer[] {
        if (this._entrance) {
            const touchable: Producer[] = [this._entrance];
            const allNode: Producer[] = [];
            this.generateMap(this._entrance, 'down', touchable, allNode);
            return allNode.filter(node => !touchable.includes(node));
        } else {
            return [];
        }
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

    private static skipProducer(target: Producer, skipped: Producer[]): void {
        skipped.push(target);
        target.children.forEach(child => {
            if (child.to.parents.every(p => skipped.includes(p.from))) {
                WorkflowManager.skipProducer(child.to, skipped);
            }
        });
    }
}
