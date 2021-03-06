import { clone } from 'lodash';

import { IParameterDescriptor, ParameterType, IWorkflow, IWorkflowResult, ProducerActivator } from '../Models';
import { WorkflowContext } from '../WorkflowContext';
import { WorkflowManager } from '../WorkflowManager';
import { ParameterTable } from '../ParamaterTable';
import { ProducerError } from '../Errors';
import { Producer } from '../Producer';

export class SubWorkflowProducer extends Producer {
    public introduce(): string {
        return 'Producer that contains a fully functional workflow';
    }

    public parameterStructure(): IParameterDescriptor {
        return {
            definition: {
                type: ParameterType.Array | ParameterType.Object,
                items: [{
                    type: ParameterType.Object,
                    optional: false,
                    description: 'Workflow\'s definition'
                }],
                optional: false,
                description: 'Workflow\'s definition or WorkflowManager'
            },
            activator: {
                type: ParameterType.Function,
                functionType: '(type: string) => (new (id?: string) => Producer)',
                optional: true,
                description: 'Activator to generate workflow, use WorkflowManager\'s default when not given.'
            },
            env: {
                type: ParameterType.Object,
                optional: true,
                default: {},
                description: 'Extra environemnt information attached to sub workflow'
            },
            opt: {
                type: ParameterType.Object,
                optional: true,
                properties: {
                    singleInput: {
                        type: ParameterType.Boolean,
                        optional: true,
                        description: 'Should consider whole input as one element'
                    },
                    returnLast: {
                        type: ParameterType.Boolean,
                        optional: true,
                        description: 'Should only return the last producer\'s result'
                    }
                },
                description: 'Workflow running options (IWorkflowOptions)'
            },
            onResult: {
                type: ParameterType.Function,
                optional: true,
                functionType: '(input: IWorkflowResult[]) => any[]',
                description: 'A function that receives result of sub workflow and returns an array as this producer\'s result.' +
                    ' Normally returns last producer\'s result'
            }
        };
    }

    public async produce(input: any[], params: ParameterTable, context: WorkflowContext): Promise<any[]> {
        const environment = SubWorkflowProducer.getEnv(params, context);
        const workflow = this.getWorkflow(params);
        const result = await workflow.run(input, environment, params.get<object>('opt')).catch((e: Error) => e);
        if (result instanceof Error) {
            throw new ProducerError('SubWorkflow', this.id, result);
        }
        const onResult = SubWorkflowProducer.getOnResult(params);
        return onResult ? onResult([result]) : result.data[result.data.length - 1].data;
    }

    protected static getEnv(params: ParameterTable, context: WorkflowContext): { [key: string]: any } {
        const environment = clone(context.environment);
        const extraEnv = params.get<{ [key: string]: any }>('env') || {};
        Object.keys(extraEnv).forEach(key => environment[key] = extraEnv[key]);
        return environment;
    }

    protected static getOnResult(params: ParameterTable): ((input: IWorkflowResult[]) => any[]) | undefined {
        return params.get<(input: IWorkflowResult[]) => any[]>('onResult');
    }

    protected getWorkflow(params: ParameterTable): WorkflowManager {
        let workflow = params.get<WorkflowManager | IWorkflow[] | undefined>('definition');
        if (workflow instanceof WorkflowManager) { return workflow; }
        if (!workflow) { throw new ProducerError('SubWorkflow', this.id, 'No definition provided'); }
        const activator = params.get<ProducerActivator | undefined>('activator');
        if (activator) {
            workflow = WorkflowManager.fromDefinitions(activator, ...workflow);
        } else {
            workflow = WorkflowManager.fromDefinitions(...workflow);
        }
        params.set('workflow', workflow);
        return workflow;
    }
}
