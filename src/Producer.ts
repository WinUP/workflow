import { ParameterDescriptor } from './Parameter';
import { Relation } from './Relation';
import * as UUID from 'uuid';

/**
 * Workflow producer
 */
export abstract class Producer {
    /**
     * Get producer's parents
     */
    public get parents(): Relation[] {
        return this._parents;
    }
    private _parents: Relation[] = [];

    /**
     * Get producer's children
     */
    public get children(): Relation[] {
        return this._children;
    }
    private _children: Relation[] = [];

    /**
     * Get producer's ID
     */
    public get id(): string {
        return this._id;
    }
    private _id: string;

    /**
     * Indicate if producer has no parent
     */
    public get isRoot(): boolean {
        return this._parents.length === 0;
    }

    /**
     * Indicate if producer has no children
     */
    public get isYoungest(): boolean {
        return this._children.length === 0;
    }

    /**
     * Decalre a workflow producer
     * @param id Producer's id. If not given, an UUID will be created instead.
     */
    public constructor(id?: string) {
        this._id = id ? id : UUID.v4().toUpperCase();
    }

    /**
     * Indicate if target producer if this producer's parent
     * @param parent Target producer
     */
    public isBelongsTo(parent: Producer): boolean {
        return this._parents.some(p => p.from === parent);
    }

    /**
     * Indicate if this producer is target producer's parent
     * @param child Target producer
     */
    public isParentOf(child: Producer): boolean {
        return this._children.some(c => c.to === child);
    }

    /**
     * Add a relation
     * @param relation Target relation
     */
    public relation(relation: Relation): this {
        if (relation.from === this) {
            this._children.push(relation);
            relation.to._parents.push(relation);
        } else if (relation.to === this) {
            this._parents.push(relation);
            relation.from._children.push(relation);
        } else {
            throw new ReferenceError(`Cannot add relation to ${this.id}: Relation has no target mentioned this producer`);
        }
        return this;
    }

    /**
     * Delete a relation
     * @param target Target relation
     */
    public breakRelation(target: Producer): this {
        if (this.isBelongsTo(target)) {
            this._parents.splice(this._parents.findIndex(p => p.from === target));
            target._children.splice(target._children.findIndex(c => c.to === this));
        } else if (this.isParentOf(target)) {
            this._children.splice(this._children.findIndex(c => c.to === target));
            target._parents.splice(target._parents.findIndex(p => p.from === this));
        } else {
            throw new ReferenceError(`Cannot break link between ${this.id} and ${target.id}: No relationship existed`);
        }
        return this;
    }

    /**
     * Indicate if producer's running conditions are all be satisfied
     * @param finishedProducers Producers that already finished running
     * @param skippedProducers Producers that will not run anymore
     */
    public isRunningConditionSatisfied(finishedProducers: Producer[], skippedProducers: Producer[]): boolean {
        if (this.isRoot) {
            return true;
        }
        if (this._parents.some(p => !skippedProducers.includes(p.from) && !finishedProducers.includes(p.from))) {
            return false;
        }
        return true;
    }

    /**
     * Initialize producer
     * @param params Parameter list
     */
    public abstract initialize(params: { [key: string]: any }): void;

    /**
     * Get producer's description
     */
    public abstract introduce(): string;

    /**
     * Get producer's parameter description
     */
    public abstract parameterStructure(): ParameterDescriptor;

    /**
     * Run this producer
     * @param input Input data
     */
    public abstract produce(input: any[]): any[] | Promise<any[]>;
}
