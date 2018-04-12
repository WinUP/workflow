import { WorkflowDefinition } from './Definition';
import { ProduceResult } from './ProduceResult';
import { Producer } from './Producer';
/**
 * Workflow manager
 */
export declare class WorkflowManager {
    private _entrance;
    private _isRunning;
    private stopInjector;
    private pauseInjector;
    private pendingCallback;
    private pendingTrigger;
    /**
     * Entrance producer
     */
    entrance: Producer | null;
    /**
     * Indicate if workflow is running
     */
    readonly isRunning: boolean;
    /**
     * Load workflow fronm definitions
     * @param activator A function that using given type string and return an instance of ```Producer```
     * or ```null``` (if cannot instancing ```Producer```)
     * @param definitions All workflow definitions
     */
    static fromDefinitions(activator: (type: string) => ((new (id?: string) => Producer) | null), ...definitions: WorkflowDefinition[]): WorkflowManager;
    /**
     * Stop workflow. Workflow will not stop immediately but stop before process next ```Producer```,
     * current running ```Producer``` cannot be stopped.
     * @throws {UnavailableError} Workflow is not running.
     * @throws {ConflictError} Workflow is in stopping progress.
     */
    stop(): Promise<void>;
    /**
     * Pause workflow. Workflow will not pause immediately but pause before process next ```Producer```,
     * current running ```Producer``` will continue run until it finished.
     * @throws {UnavailableError} Workflow is not running.
     * @throws {ConflictError} Workflow is in pausing progress.
     */
    pause(): Promise<void>;
    /**
     * Resume workflow.
     * @throws {UnavailableError} Workflow is not running or not paused.
     */
    resume(): void;
    /**
     * Run this workflow
     * @param input Input data
     * @returns An array contains each ```Producer```'s result. Regurally last one is the last ```Producer```'s result.
     */
    run<T, U = T>(input: T): Promise<{
        data: ProduceResult<U>[];
        finished: boolean;
    }>;
    /**
     * Validate current workflow to find any unreachable producers.
     */
    validate(): Producer[];
    private generateMap(entrance, searchDirection, touchable, allNode);
    private static skipProducer(target, skipped);
}
