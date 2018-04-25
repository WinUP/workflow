import { Parameter } from './Parameter';
import { Relation } from './Relation';
/**
 * Workflow producer
 */
export declare abstract class Producer {
    /**
     * Get producer's parents
     */
    readonly parents: Relation[];
    private _parents;
    /**
     * Get producer's children
     */
    readonly children: Relation[];
    private _children;
    /**
     * Get producer's ID
     */
    readonly id: string;
    private _id;
    /**
     * Indicate if producer has no parent
     */
    readonly isRoot: boolean;
    /**
     * Indicate if producer has no children
     */
    readonly isYoungest: boolean;
    /**
     * Decalre a workflow producer
     * @param id Producer's id. If not given, an UUID will be created instead.
     */
    constructor(id?: string);
    /**
     * Indicate if target producer if this producer's parent
     * @param parent Target producer
     */
    isBelongsTo(parent: Producer): boolean;
    /**
     * Indicate if this producer is target producer's parent
     * @param child Target producer
     */
    isParentOf(child: Producer): boolean;
    /**
     * Add a relation
     * @param relation Target relation
     */
    relation(relation: Relation): this;
    /**
     * Delete a relation
     * @param target Target relation
     */
    breakRelation(target: Producer): this;
    /**
     * Indicate if producer's running conditions are all be satisfied
     * @param finishedProducers Producers that already finished running
     * @param skippedProducers Producers that will not run anymore
     */
    isRunningConditionSatisfied(finishedProducers: Producer[], skippedProducers: Producer[]): boolean;
    /**
     * Initialize producer
     * @param params Parameter list
     */
    abstract initialize(...params: any[]): void;
    /**
     * Get producer's description
     */
    abstract introduce(): string;
    /**
     * Get producer's parameter description
     */
    abstract parameterStructure(): Parameter[];
    /**
     * Run this producer
     * @param input Input data
     */
    abstract produce(input: any[]): any[] | Promise<any[]>;
}
