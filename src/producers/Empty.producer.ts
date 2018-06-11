import { ParameterDescriptor } from '../Parameter';
import { Producer } from '../Producer';

/**
 * Empty producer
 */
export class EmptyProducer extends Producer {

    public introduce(): string {
        return 'Producer that does nothing';
    }

    public parameterStructure(): ParameterDescriptor {
        return { };
    }

    protected produce(input: any[]): any[] | Promise<any[]> {
        return input;
    }
}
