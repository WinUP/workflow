/**
 * Parameter information
 */
export interface Parameter {
    /**
     * Type, see ParameterType for more information
     */
    type: string | number;
    /**
     * Subparameter (in array or object)
     */
    children?: Parameter[];
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

/**
 * Parameter type
 */
export enum ParameterType {
    String  = 0B1,
    Number  = 0B10,
    Boolean = 0B100,
    Array   = 0B1000,
    Object  = 0B10000,
    Null    = 0B100000,
    Any     = 0B111111
}
