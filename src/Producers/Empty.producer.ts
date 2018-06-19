import { IParameterDescriptor } from '../Parameter';
import { Producer } from '../Producer';

/**
 * Empty producer
 */
export class EmptyProducer extends Producer {

    public introduce(): string {
        return 'Producer that does nothing';
    }

    public parameterStructure(): IParameterDescriptor {
        return { };
    }

    public produce(input: any[]): any[] {
        return input;
    }
}
