import * as UUID from 'uuid';

import { isSpecialParameter, SpecialParameterType, IParameterDescriptor } from './Models';
import { WorkflowContext } from './WorkflowContext';
import { ParameterTable } from './ParamaterTable';
import { Relation } from './Relation';

/**
 * Workflow producer
 */
export abstract class Producer {
    /**
     * Get producer's parameter table
     */
    public readonly parameters: ParameterTable = new ParameterTable();

    /**
     * Get producer's parents
     */
    public readonly parents: Relation[] = [];

    /**
     * Get producer's children
     */
    public readonly children: Relation[] = [];

    /**
     * Get producer's ID
     */
    public readonly id: string;

    /**
     * Delayed millisecond before run producer
     */
    public runningDelay: number = 0;

    /**
     * Delayed millisecond before return producer's result
     */
    public replyDelay: number = 0;

    /**
     * Function runs after proceed data (after applied delay time)
     */
    public proceed: ((input: any[]) => any[] | Promise<any[]>) | string | undefined;

    /**
     * If this function returns error, workflow will be terminated
     */
    public errorHandler: ((error: Error, params: ParameterTable, context: WorkflowContext) => any[]) | undefined;

    /**
     * Indicate if producer has no parent
     */
    public get isRoot(): boolean {
        return this.parents.length === 0;
    }

    /**
     * Indicate if producer has no children
     */
    public get isYoungest(): boolean {
        return this.children.length === 0;
    }

    /**
     * Decalre a workflow producer
     * @param id Producer's id. If not given, an UUID will be created instead.
     */
    public constructor(id?: string) {
        this.id = id || UUID.v4().toUpperCase();
    }

    /**
     * Indicate if target producer if this producer's parent
     * @param parent Target producer
     */
    public isBelongsTo(parent: Producer): boolean {
        return this.parents.some(p => p.from === parent);
    }

    /**
     * Indicate if this producer is target producer's parent
     * @param child Target producer
     */
    public isParentOf(child: Producer): boolean {
        return this.children.some(c => c.to === child);
    }

    /**
     * Add a relation
     * @param relation Target relation
     */
    public relation(relation: Relation): this {
        if (relation.from === this) {
            this.children.push(relation);
            relation.to.parents.push(relation);
        } else if (relation.to === this) {
            this.parents.push(relation);
            relation.from.children.push(relation);
        } else {
            throw new ReferenceError(`Cannot add relation to ${this.id}: Relation has no target mentioned this producer`);
        }
        return this;
    }

    /**
     * Delete a relation
     * @param target Target relation or producer
     */
    public breakRelation(target: Producer | Relation): this {
        let node: Producer;
        if (target instanceof Producer) {
            node = target;
        } else {
            if (target.from === this) {
                node = target.to;
            } else if (target.to === this) {
                node = target.from;
            } else {
                throw new ReferenceError(`Cannot break link ${target.from} -> ${target.to}: Relationship does not contains this`);
            }
        }
        if (this.isBelongsTo(node)) {
            this.parents.splice(this.parents.findIndex(p => p.from === node));
            node.children.splice(node.children.findIndex(c => c.to === this));
        } else if (this.isParentOf(node)) {
            this.children.splice(this.children.findIndex(c => c.to === node));
            node.parents.splice(node.parents.findIndex(p => p.from === this));
        } else {
            throw new ReferenceError(`Cannot break link between ${this.id} and ${node.id}: No relationship existed`);
        }
        return this;
    }

    /**
     * Indicate if producer's running conditions are all be satisfied
     * @param finishedProducers Producers that already finished running
     * @param skippedProducers Producers that will not run anymore
     */
    public fitCondition(finishedProducers: Producer[], skippedProducers: Producer[]): boolean {
        if (this.isRoot) {
            return true;
        }
        if (this.parents.some(p => !skippedProducers.includes(p.from) && !finishedProducers.includes(p.from))) {
            return false;
        }
        return true;
    }

    /**
     * Initialize producer
     * @param params Parameter list
     */
    public initialize(params: { [key: string]: any }): void {
        let result = Producer.parseParams(params);
        result = this.checkParameters(result);
        this.parameters.use(result);
    }

    /**
     * Run this producer
     * @param input Input data
     */
    public async prepareExecute(input: any[], params: { [key: string]: any }, context: WorkflowContext): Promise<any[]> {
        const keys = Object.keys(params);
        if (this.runningDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, this.runningDelay));
        }
        let result: any[];
        let activeParameters = this.parameters;
        if (keys.length > 0) {
            activeParameters = this.parameters.clone();
            activeParameters.patch(this.checkParameters(params));
        }
        try {
            result = await this.produce(input, activeParameters, context);
        } catch (ex) {
            if (!(ex instanceof Error)) { ex = new TypeError(ex); }
            result = await this.onError(ex, activeParameters, context);
            if (result instanceof Error) {
                throw result;
            }
        }
        if (this.replyDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, this.replyDelay));
        }
        result = result instanceof Array ? result : [result];
        result = await this.runProceed(result);
        return result instanceof Array ? result : [result];
    }

    /**
     * Check parameters when new parameters set
     * @param params New parameters
     */
    protected checkParameters(params: { [key: string]: any }): { [key: string]: any } {
        return params;
    }

    /**
     * Get producer's description
     */
    public abstract introduce(): string;

    /**
     * Get producer's parameter description
     */
    public abstract parameterStructure(): IParameterDescriptor;

    public abstract produce(input: any[], params: ParameterTable, context: WorkflowContext): any[] | Promise<any[]>;

    private async runProceed(input: any[]): Promise<any[]> {
        if (!this.proceed) {
            return input;
        } else if (typeof this.proceed === 'string') {
            return eval(`(function(input){${this.proceed}})(input)`);
        } else {
            return this.proceed(input);
        }
    }

    private async onError(error: any, params: ParameterTable, context: WorkflowContext): Promise<any[]> {
        if (!this.errorHandler) {
            return error;
        } else if (typeof this.errorHandler === 'string') {
            return eval(`(function(error, params, context){${this.proceed}})(error, params, context)`);
        } else {
            return this.errorHandler(error, params, context);
        }
    }

    private static parseParams(params: { [key: string]: any }): { [key: string]: any } {
        if (typeof params !== 'object' || params == null) {
            return params;
        }
        if (isSpecialParameter(params)) {
            if (params.type === SpecialParameterType.Eval) {
                params = eval(params.content);
            }
        }
        Object.keys(params).forEach(key => {
            if (params[key] instanceof Array) {
                for (let i = -1; ++i < params[key].length;) {
                    params[key][i] = Producer.parseParams(params[key][i]);
                }
            } else if (typeof params[key] === 'object' && Object.getPrototypeOf(params[key].constructor) === Object) {
                params[key] = Producer.parseParams(params[key]);
            }
        });
        return params;
    }
}
