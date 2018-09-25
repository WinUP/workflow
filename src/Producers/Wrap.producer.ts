import { IParameterDescriptor, ParameterType } from '../Models';
import { WorkflowContext } from '../WorkflowContext';
import { ParameterTable } from '../ParamaterTable';
import { Producer } from '../Producer';

export class WrapProducer extends Producer {
    public introduce(): string {
        return 'Using given handler function create a new producer';
    }

    public parameterStructure(): IParameterDescriptor {
        return {
            handler: {
                type: ParameterType.Function,
                optional: false,
                description: 'Produce function\'s implementation fit (input: any[], params: ParameterTable) => any[] | Promise<any[]>'
            }
        };
    }

    public produce(input: any[], params: ParameterTable, context: WorkflowContext): any[] | Promise<any[]> {
        const handler = params.get<Function>('handler');
        return handler ? handler(input, params, context) : input;
    }
}
