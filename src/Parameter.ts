/**
 * Parameter descripton
 */
export interface Parameter {
    /**
     * Type
     */
    type: 'string' | 'object' | 'number' | 'boolean' | 'array' | 'null';
    /**
     * Name (in object)
     */
    name?: string;
    /**
     * Subparameter (in array or object)
     */
    subparams?: Parameter[];
    /**
     * Is optional
     */
    optional: boolean;
    /**
     * Default value. If this exist, parameter should be optional
     */
    default?: any;
    /**
     * Description
     */
    description: string;
}
