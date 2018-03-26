import { ParameterDescriptor } from '../Parameter';
import { Producer } from '../Producer';
/**
 * Data picker producer
 */
export declare class DataPickerProducer extends Producer {
    protected checkParameters(params: {
        [key: string]: any;
    }): {
        [key: string]: any;
    };
    introduce(): string;
    parameterStructure(): ParameterDescriptor;
    protected _produce(input: any[]): any[] | Promise<any[]>;
}
