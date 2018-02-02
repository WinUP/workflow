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
     * Description
     */
    description: string;
}
