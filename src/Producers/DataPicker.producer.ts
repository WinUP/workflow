import * as JPQuery from '@ekifvk/jpquery';

import { IParameterDescriptor, ParameterType } from '../Models';
import { ParameterTable } from '../ParamaterTable';
import { ProducerError } from '../Errors';
import { Producer } from '../Producer';

/**
 * Data picker producer
 */
export class DataPickProducer extends Producer {
    protected checkParameters(params: { [key: string]: any }): { [key: string]: any } {
        if (params.query !== undefined) {
            if (typeof params.query !== 'string') {
                throw new ProducerError('DataPick', this.id,  'Parameter "query" must be string');
            }
            params.query = JPQuery.analyse(params.query);
        }
        return params;
    }

    public introduce(): string {
        return 'Pick data from json object or array using JPQuery. If query string not starts with /, it will be copy to output.\n' +
            'Example: "/data1" -> (input.data1 or each element\'s data1 field if input is array)';
    }

    public parameterStructure(): IParameterDescriptor {
        return {
            query: {
                type: ParameterType.String,
                optional: false,
                description: 'JPQuery query string, see @ekifvk/jpquery\'s document on npm to learn how to use'
            }
        };
    }

    public produce(input: any[], params: ParameterTable): any[] {
        const query = params.get<JPQuery.AnalyzerUnit[]>('query');
        if (!query) {
            throw new ProducerError('DataPick', this.id,  'No query string');
        }
        return input.map(data => JPQuery.pick(data, query));
    }
}
