import { ParameterDescriptor } from '../Parameter';
import { Producer } from '../Producer';
/**
 * Structured data picker producer
 */
export declare class StructuredDataPickerProducer extends Producer {
    private _query;
    protected _initialize(params: {
        [key: string]: any;
    }): void;
    introduce(): string;
    parameterStructure(): ParameterDescriptor;
    produce(input: any[]): any[] | Promise<any[]>;
    private static pickData(input, source);
}
