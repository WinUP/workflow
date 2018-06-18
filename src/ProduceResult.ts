import { Producer } from './Producer';

/**
 * Producer's running result
 */
export interface ProduceResult<T = any> {
    /**
     * Target producer
     */
    producer: Producer;
    /**
     * Running result
     */
    data: T[];
}
