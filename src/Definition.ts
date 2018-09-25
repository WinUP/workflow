import { WorkflowContext } from './WorkflowContext';
import { ParameterTable } from './ParamaterTable';

/**
 * Workflow definition
 */
export interface IWorkflow {
    /**
     * Producers
     */
    producers?: IProducer[];
    /**
     * Relations
     */
    relations?: IRelation[];
    /**
     * Entrance producer
     */
    entrance?: string;
    /**
     * Output producer (if have)
     */
    output?: string;
}

/**
 * Producer definition
 */
export interface IProducer {
    /**
     * Type
     */
    type: string;
    /**
     * Id
     */
    id: string;
    /**
     * Initial parameters
     */
    parameters: { [key: string]: any };
    /**
     * Description
     */
    description?: string;
    /**
     * Delayed millisecond before run producer
     */
    runningDelay?: number;
    /**
     * Delayed millisecond before return producer's result
     */
    replyDelay?: number;
    /**
     * Function runs after proceed data (after applied delay time)
     */
    proceed?: ((input: any[]) => any[] | Promise<any[]>) | string;
    /**
     * If this function returns error, workflow will be terminated
     */
    errorHandler?: (error: Error, params: ParameterTable, context: WorkflowContext) => any;
}

/**
 * Relation definition
 */
export interface IRelation {
    /**
     * Parent producer
     */
    from: string;
    /**
     * Child producer
     */
    to: string;
    /**
     * Inject parameter name
     */
    inject?: string;
    /**
     * Condition
     */
    condition?: string | null | ((input: any) => boolean);
    /**
     * Allow empty (empty array) data transfers to relation's target, otherwise target will be disabled on this situation
     */
    allowEmptyInput?: boolean;
}

export interface ISpecialParameter<T = any> {
    type: SpecialParameterType;
    content: T;
}

export enum SpecialParameterType {
    Eval = 'eval'
}

const parameterTypes = [SpecialParameterType.Eval];

export function isSpecialParameter(input: any): input is ISpecialParameter {
    if (typeof input !== 'object') {
        return false;
    }
    const keys = Object.keys(input);
    if (!keys.includes('type') || !keys.includes('content')) {
        return false;
    }
    if (!parameterTypes.includes(input.type)) {
        return false;
    }
    return true;
}
