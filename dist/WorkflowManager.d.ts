import { WorkflowDefinition } from './Definition';
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
     * Load workflow fronm definitions
     * @param activator A function that using given type string and return an instance of Producer or null (if cannot declare producer)
     * @param definitions All workflow definitions
     */
    static fromDefinitions(activator: (type: string) => ((new (id?: string) => Producer) | null), ...definitions: WorkflowDefinition[]): WorkflowManager;
    /**
     * Run this workflow
     * @param input Input data
     * @returns An array contains each producer's result. Regurally last one is the last producer's result.
     */
    run<T, U = T>(input: T): Promise<ProduceResult<U>[]>;
    validate(): Producer[];
    private generateMap(entrance, searchDirection, touchable, allNode);
    private static skipProducer(target, skipped);
}
