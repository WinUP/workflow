import { ParameterDescriptor, ParameterType } from '../Parameter';
import { Producer } from '../Producer';
import * as JPQuery from '@ekifvk/jpquery';

/**
 * Data picker producer
 */
export class DataPickerProducer extends Producer {
    private _query: JPQuery.AnalyzerUnit[] = [];

    public initialize(params: { [key: string]: any }): void {
        if (typeof params.query !== 'string') {
            throw new TypeError(`Cannot create data picker: Parameter 'query' must be string`);
        }
        this._query = JPQuery.analyse(params.query);
    }

    public introduce(): string {
        return 'Pick data from json object or array using JPQuery, if query string not starts with /, it will be copy to output.\n' +
            'Example: "/data1" -> data1';
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

    public produce(input: any[]): any[] | Promise<any[]> {
        return input.map(data => JPQuery.pick(data, this._query));
    }
}
