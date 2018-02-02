import { Producer } from './Producer';
/**
 * Producer's running result
 */
export interface ProduceResult<T> {
    /**
     * Target producer
     */
    producer: Producer;
    /**
     * Running result
     */
    data: T;
}
