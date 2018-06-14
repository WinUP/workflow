/**
 * Parameter information
 */
export interface Parameter {
    /**
     * Type, see ParameterType for more information
     */
    type: number;
    /**
     * Subparameter (in object)
     */
    properties?: ParameterDescriptor;
    /**
     * Subparameter (in array)
     */
    items?: Parameter[];
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
 * Parameter descriptor
 */
export interface ParameterDescriptor {
    [key: string]: Parameter;
}

/**
 * Type of parameter
 */
export enum ParameterType {
    String = 1,
    Number = 1 << 1,
    Boolean = 1 << 2,
    Array = 1 << 3,
    Object = 1 << 4,
    Null = 1 << 5,
    Function = 1 << 6,
    Any = ParameterType.String | ParameterType.Number | ParameterType.Boolean | ParameterType.Array |
    ParameterType.Object | ParameterType.Null | ParameterType.Function
}
