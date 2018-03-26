import { ParameterDescriptor } from '../Parameter';
import { Producer } from '../Producer';
/**
 * Structured data picker producer
 */
export declare class StructuredDataPickerProducer extends Producer {
    introduce(): string;
    parameterStructure(): ParameterDescriptor;
    protected _produce(input: any[]): any[] | Promise<any[]>;
    private static pickData(input, source);
}
