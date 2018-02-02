import { ProduceResult } from './ProduceResult';
import { Producer } from './Producer';

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
                if (runner.producer.isRunningConditionSatisfied(finished, skipped)) {
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
                    afterRunning.push(runner);
                }
            }
            running = afterRunning;
        }
        return dataPool;
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
