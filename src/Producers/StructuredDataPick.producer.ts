import * as JPQuery from '@ekifvk/jpquery';

import { IParameterDescriptor, ParameterType } from '../Models';
import { ParameterTable } from '../ParamaterTable';
import { ProducerError } from '../Errors';
import { Producer } from '../Producer';

/**
 * Structured data picker producer
 */
export class StructuredDataPickProducer extends Producer {
    public introduce(): string {
        return 'Pick data from json object or array using JPQuery using given structure. ' +
            'if any query string not starts with /, it will be copy to output\'s same place. ' +
            'Different places\'s query string will be put to output structure\s same place, even in object and array.\n' +
            'Example: { a: "/data1", b: [ "/data2", "/data3" ] } -> { a: data1, b: [ data2, data3 ] }';
    }

    public parameterStructure(): IParameterDescriptor {
        return {
            query: {
                type: ParameterType.Array | ParameterType.Object,
                optional: false,
                description: 'An object or array that all value should be object/array/query string. ' +
                    'See @ekifvk/jpquery\'s document on npm to learn how to use'
            }
        };
    }

    public produce(input: any[], params: ParameterTable): any[] {
        const query = params.get<JPQuery.AnalyzerUnit[]>('query');
        if (!query) {
            throw new ProducerError('StructuredDataPick', this.id,  'No query structure');
        }
        return input.map(data => StructuredDataPickProducer.pickData(query, data));
    }

    protected static pickData(input: any, source: any): any {
        if (input instanceof Array) {
            return input.map(v => this.pickData(v, source));
        } else if (input == null) {
            return null;
        } else if (typeof input !== 'object') {
            if (typeof input === 'string') {
                return input.startsWith('/') ? JPQuery.pick(source, JPQuery.analyse(input)) : input;
            } else {
                return input;
            }
        } else {
            const result: { [key: string]: any } = {};
            Object.keys(input).forEach(key => {
                if (input[key] == null) {
                    result[key] = null;
                } else if (typeof input[key] === 'object') { // 数组或对象
                    result[key] = this.pickData(input[key], source);
                } else if (typeof input[key] === 'string') {
                    result[key] = (input[key] as string).startsWith('/')
                    ? JPQuery.pick(source, JPQuery.analyse(input[key] as string))
                    : input[key];
                } else {
                    result[key] = input[key];
                }
            });
            return result;
        }
    }
}
