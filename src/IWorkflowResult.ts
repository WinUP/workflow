import { IProduceResult } from './ProduceResult';

/**
 * Running result for workflow
 */
export interface IWorkflowResult {
    /**
     * Producer's results
     */
    data: IProduceResult<any>[];
    /**
     * Is workflow finished with no cancellation
     */
    finished: boolean;
}
