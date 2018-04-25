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
export declare enum ParameterType {
    String = 1,
    Number = 2,
    Boolean = 4,
    Array = 8,
    Object = 16,
    Null = 32,
    Any = 63,
}
