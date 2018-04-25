import { Parameter } from './Parameter';
/**
 * Workflow definition
 */
export interface WorkflowDefinition {
    /**
     * Producers
     */
    producers?: ProducerDefinition[];
    /**
     * Relations
     */
    relations?: RelationDefinition[];
    /**
     * Entrance producer
     */
    entrance?: string;
}
/**
 * Producer definition
 */
export interface ProducerDefinition {
    /**
     * Type
     */
    type: string;
    /**
     * Id
     */
    id: string;
    /**
     * Parameters for initializer
     */
    parameters: Parameter[];
    /**
     * Description
     */
    description?: string;
}
/**
 * Relation definition
 */
export interface RelationDefinition {
    /**
     * Parent producer
     */
    from: string;
    /**
     * Child producer
     */
    to: string;
    /**
     * Condition
     */
    condition?: string | null;
}
