import { WorkflowDefinition } from './Definition';
import { ProduceResult } from './ProduceResult';
import { Producer } from './Producer';
/**
 * Workflow manager
 */
export declare class WorkflowManager {
    private _entrance;
    private _output;
    private _isRunning;
    private _finishedNodes;
    private _skippedNodes;
    private stopInjector;
    private pauseInjector;
    private pendingCallback;
    private pendingTrigger;
    /**
     * Entrance producer
     */
    entrance: Producer | null;
    /**
     * Output producer. If not set, workflow will return all producer's output data after run.
     */
    output: Producer | null;
    /**
     * Indicate if workflow is running
     */
    readonly isRunning: boolean;
    /**
     * Get all node ids that skipped in running
     */
    readonly skipped: ReadonlyArray<string>;
    /**
     * Get all node ids that finished in running
     */
    readonly finished: ReadonlyArray<string>;
    /**
     * Validate current workflow to find any unreachable producers.
     */
    readonly unreachableNodes: Producer[];
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
     * @returns An array contains each ```Producer```'s result if no output set, regurally last one is the last ```Producer```'s result.
     * If ```this.output``` is not null, this array will only contains ```this.output```'s result.
     * @description If ```this.output``` is not null, algorithm will release memory when any ```Producer```'s data is not
     * useful, typically it can highly reduce memory usage.
     */
    run<T, U = T>(input: T): Promise<{
        data: ProduceResult<U>[];
        finished: boolean;
    }>;
    private generateMap(entrance, searchDirection, touchable, allNode);
    private skipProducer(target, skipped);
}
