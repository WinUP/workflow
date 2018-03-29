import { ParameterDescriptor } from '../Parameter';
import { Producer } from '../Producer';
/**
 * Data picker producer
 */
export declare class EmptyProducer extends Producer {
    introduce(): string;
    parameterStructure(): ParameterDescriptor;
    protected _produce(input: any[]): any[] | Promise<any[]>;
}
