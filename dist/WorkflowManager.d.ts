import { ProduceResult } from './ProduceResult';
import { Producer } from './Producer';
/**
 * Workflow manager
 */
export declare class WorkflowManager {
    private _entrance;
    /**
     * Entrance producer
     */
    entrance: Producer | null;
    /**
     * Run this workflow
     * @param input Input data
     * @returns An array contains each producer's result. Regurally last one is the last producer's result.
     */
    run<T, U = T>(input: T): Promise<ProduceResult<U>[]>;
    private static skipProducer(target, skipped);
}
