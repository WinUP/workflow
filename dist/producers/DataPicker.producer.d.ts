import { ParameterDescriptor } from '../Parameter';
import { Producer } from '../Producer';
/**
 * Data picker producer
 */
export declare class DataPickerProducer extends Producer {
    private _query;
    initialize(params: {
        [key: string]: any;
    }): void;
    introduce(): string;
    parameterStructure(): ParameterDescriptor;
    produce(input: any[]): any[] | Promise<any[]>;
}
