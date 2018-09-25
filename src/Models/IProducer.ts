import { WorkflowContext } from '../WorkflowContext';
import { ParameterTable } from '../ParamaterTable';

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
    errorHandler?: (error: Error, params: ParameterTable, context: WorkflowContext) => any[];
}
