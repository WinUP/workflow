import { IParameterDescriptor, ParameterType } from '../Parameter';
import { SubWorkflowProducer } from './SubWorkflow.producer';
import { WorkflowContext } from '../WorkflowContext';
import { IWorkflowResult } from '../IWorkflowResult';
import { ParameterTable } from '../ParamaterTable';
import { ProducerError } from '../errors';

export type CirculateSubWorkflowOnLoop =
    (env: { [key: string]: any }, context: WorkflowContext, output: IWorkflowResult | undefined) => boolean;

export class CirculateSubWorkflowProducer extends SubWorkflowProducer {
    public introduce(): string {
        return 'Run sub workflow in while-loop, use onLoop param as while condition';
    }

    public parameterStructure(): IParameterDescriptor {
        return {
            ...super.parameterStructure(),
            onLoop: {
                type: ParameterType.Function,
                optional: false,
                description: 'While-loop\'s codition. First param is sub workflow\'s env, second is main workflow\s context,' +
                    'last is previous loop\'s result (undefined in first loop).'
            }
        };
    }

    public async produce(input: any[], params: ParameterTable, context: WorkflowContext): Promise<any[]> {
        const environment = SubWorkflowProducer.getEnv(params, context);
        const workflow = this.getWorkflow(params);
        const onLoop = params.get<CirculateSubWorkflowOnLoop | undefined>('onLoop');
        if (!onLoop) {
            throw new ProducerError('CirculateSubWorkflow', this.id, 'No onLoop function');
        }
        const data: IWorkflowResult[] = [];
        let previousResult: IWorkflowResult | undefined;
        while (onLoop(environment, context, previousResult)) {
            const result = await workflow.run(input, environment).catch((e: Error) => e);
            if (result instanceof Error) {
                throw new ProducerError('CirculateSubWorkflow', this.id, result);
            }
            previousResult = result;
            data.push(previousResult);
        }
        const onResult = SubWorkflowProducer.getOnResult(params);
        if (onResult) {
            return onResult(data);
        } else {
            const lastData = data[data.length - 1];
            return lastData.data[lastData.data.length].data;
        }
    }
}
