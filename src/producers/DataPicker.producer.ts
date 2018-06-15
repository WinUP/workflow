import { ParameterDescriptor, ParameterType } from '../Parameter';
import { ParameterTable } from '../ParamaterTable';
import { Producer } from '../Producer';
import * as JPQuery from '@ekifvk/jpquery';

/**
 * Data picker producer
 */
export class DataPickerProducer extends Producer {

    protected checkParameters(params: { [key: string]: any }): { [key: string]: any } {
        if (params.query !== undefined) {
            if (typeof params.query !== 'string') {
                throw new TypeError(`Data picker ${this.id}: Parameter 'query' must be string`);
            }
            params.query = JPQuery.analyse(params.query);
        }
        return params;
    }

    public introduce(): string {
        return 'Pick data from json object or array using JPQuery. If query string not starts with /, it will be copy to output.\n' +
            'Example: "/data1" -> (input.data1 or each element\'s data1 field if input is array)';
    }

    public parameterStructure(): ParameterDescriptor {
        return {
            query: {
                type: ParameterType.String,
                optional: false,
                description: 'JPQuery query string, see @ekifvk/jpquery\'s document on npm to learn how to use'
            }
        };
    }

    public produce(input: any[], activeParams: ParameterTable): any[] {
        const query = activeParams.get<JPQuery.AnalyzerUnit[]>('query');
        if (!query) {
            throw new TypeError(`Data picker ${this.id}: No query string`);
        }
        return input.map(data => JPQuery.pick(data, query));
    }
}
