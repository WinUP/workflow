import { ProduceResult } from './ProduceResult';

/**
 * Running result for workflow
 */
export interface WorkflowResult {
    /**
     * Producer's results
     */
    data: ProduceResult<any>[];
    /**
     * Is workflow finished with no cancellation
     */
    finished: boolean;
}
