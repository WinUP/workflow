import { WorkflowDefinition, RelationDefinition } from './Definition';
import { ProduceResult } from './ProduceResult';
import { Producer } from './Producer';
import { Relation } from './Relation';

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
            from!.relation(new Relation(from, to, relation.condition ? relation.condition : undefined));
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
        let running: ProduceResult<any[]>[] = [{producer: this._entrance, data: [input]}];
        const finished: Producer[] = [];
        const skipped: Producer[] = [];
        const dataPool: ProduceResult<any>[] = [];
        while (running.length > 0) {
            const afterRunning: ProduceResult<any>[] = [];
            for (let i = 0; i < running.length; i++) {
                const runner = running[i];
                if (!afterRunning.some(r => r.producer === runner.producer)
                    && runner.producer.isRunningConditionSatisfied(finished, skipped)) {
                    const result = runner.producer.produce(runner.data);
                    const syncResult = result instanceof Promise ? await result : result;
                    finished.push(runner.producer);
                    dataPool.push({ producer: runner.producer, data: syncResult });
                    runner.producer.children.forEach(child => {
                        const suitableResult = syncResult.filter(r => child.judge(r));
                        if (suitableResult.length > 0) {
                            let newRunner = afterRunning.find(r => r.producer === child.to);
                            if (!newRunner) {
                                newRunner = { producer: child.to, data: [] };
                                afterRunning.push(newRunner);
                            }
                            newRunner.data = [...newRunner.data, ...suitableResult];
                        } else {
                            WorkflowManager.skipProducer(child.to, skipped);
                        }
                    });
                } else {
                    const existedRunner = afterRunning.find(r => r.producer === runner.producer);
                    if (existedRunner) {
                        existedRunner.data = [...existedRunner.data, ...runner.data];
                    } else {
                        afterRunning.push(runner);
                    }
                }
            }
            running = afterRunning;
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
