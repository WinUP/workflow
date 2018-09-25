import { IParameterDescriptor } from './IParameterDescriptor';

/**
 * Parameter information
 */
export interface IParameter {
    /**
     * Type, see ParameterType for more information
     */
    type: number;
    /**
     * Subparameter (in object)
     */
    properties?: IParameterDescriptor;
    /**
     * Subparameter (in array)
     */
    items?: IParameter[];
    /**
     * Function definition in TypeScript
     */
    functionType?: string | {
        params: IParameter[],
        result: IParameter
    };
    /**
     * Available values
     */
    enum?: any[];
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
