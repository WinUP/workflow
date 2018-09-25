import { IProducer } from './IProducer';
import { IRelation } from './IRelation';

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
