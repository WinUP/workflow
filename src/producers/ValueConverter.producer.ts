import { ParameterDescriptor, ParameterType } from '../Parameter';
import { Producer } from '../Producer';
import { isEqual } from 'lodash';

/**
 * Value convert rule
 */
export interface ValueConvertRule<T = any, U = any> {
    /**
     * Is this the default rule (using when any other rules are not fit)
     */
    default?: boolean;
    /**
     * Define data that fit this rule. Can be function with two params (input, this) and returns true/false
     */
    key?: T;
    /**
     * Define procedure to convert the data. Can be function with two params (input, this)
     */
    value: U;
}

/**
 * 值转换处理器
 */
export class ValueConverterProducer extends Producer {
    private _rules: ValueConvertRule[] = [];
    private _structure: { [key: string]: object | boolean } = {};

    public initialize(params: { [key: string]: any }): void {
        if (!(params.rules instanceof Array)) {
            throw new TypeError(`Cannot create value converter: Parameter 'rules' must be Array`);
        }
        this._rules = params.rules;
        if (params.structure == null) {
            throw new TypeError(`Cannot create value converter: Parameter 'structure' cannot be null`);
        }
        this._structure = params.structure;
    }

    public introduce(): string {
        return 'Use given structure to focus on input data\'s specific places, then using rules to convert the value.';
    }

    public parameterStructure(): ParameterDescriptor {
        return {
            rules: {
                type: ParameterType.Array,
                optional: false,
                description: 'Convert rules, must be array of ValueConvertRule. ' +
                    'Value converter follow such procedure to find suitable rule:\n' +
                    '1. Use key to judge data. If key is function then call it and judge return data, otherwise compair them.\n' +
                    '2. If (1) has no suitable rule, using default rule if have.\n' +
                    '3. If (2) has no suitable rule, do nothing on this data.\n' +
                    'Example: [{ key: "123", value: "456" }] -> convert "123" to "456"\n' +
                    '[{ key: i => i.startsWith("1"), value: "456" }] -> convert all string starts with "1" to "456"\n' +
                    '[{ key: i => typeof i === "number", value: i => i * 2 }] -> convert all number to 2 * itself'
            },
            structure: {
                type: ParameterType.Any,
                optional: true,
                default: {},
                description: 'Data indicate structure, using to find data should be converted from input. ' +
                    'Value converter follow such procedure to find data:\n' +
                    '1. If structure is null/undefined/number/boolean/string, direct convert input data.\n' +
                    '2. If (1) not suitable and structure is object (not array):\n' +
                    '2.1 Structure is empty object, convert all level 1 value in input\'s same place if also an object.\n' +
                    '2.2 Any value in structure is false, convert all level 1 value in input\'s same place without false one.\n' +
                    '2.3 Any value in structure is true, convert target level 1 value in input\'s same place.\n' +
                    '3. If (2) not suitable and structure is array:\n' +
                    '3.1 Has an element of object, using to convert input \'s same place\'s array\'s children of object.\n' +
                    '3.2 Fit (3.1) and has element of true, all non-object value in input \'s same place\'s array will be convert.\n' +
                    '3.3 Not fit (3.2) and has element of true, all value in input \'s same place\'s array will be convert.\n' +
                    '4. If (3) not suitable then do nothing.\n' +
                    'Example: true -> direct convert input data\n' +
                    '{ data1: true } -> convert data1\'s value in input if input is object\n' +
                    '{ data1: {} } -> convert data1\'s all level 1 children\'s value in input if input and data1 is object\n' +
                    '{ data1: true, data2: true } -> convert data1 and data2\'s value in input if input is object\n' +
                    '{ data1: [true] } -> convert data1\'s all elements if data1 is array\n' +
                    '{ data1: [ { data2: {} } ] } -> convert all objects in data1 using structure { data2: {} }'
            }
        };
    }

    public produce(input: any[]): any[] | Promise<any[]> {
        return input.map(data => {
            if (data == null) {
                return null;
            } if (typeof data === 'object') {
                return this.convert(this._structure, data);
            } else {
                return ValueConverterProducer.pickValue(data, this._rules);
            }
        });
    }

    private convert(structure: any, source: any): object | null | undefined {
        // 空值转换
        if (source === null) {
            return ValueConverterProducer.pickValue(source, this._rules);
        }
        if (source === undefined) {
            return ValueConverterProducer.pickValue(source, this._rules);
        }
        // 结构定义为false
        if (structure === false) {
            return source;
        }
        // 输入值不为对象（此时忽略结构定义），或结构定义为true
        if (typeof source !== 'object' || structure === true) {
            return ValueConverterProducer.pickValue(source, this._rules);
        }
        let result: any = {};
        // 输入值为数组且结构定义为数组
        if (source instanceof Array && structure instanceof Array) {
            // 数组定义为空，视为不转换
            if (structure.length === 0) {
                result = source;
            } else { // 其他情况
                const objectStructure = structure.find(v => typeof v === 'object' && v);
                const hasTrue = structure.some(v => v === true);
                if (!objectStructure && hasTrue) { // 无结构定义，存在true
                    result = source.map(v => ValueConverterProducer.pickValue(v, this._rules));
                } else if (objectStructure) { // 有结构定义
                    result = source.map(v => {
                        if (typeof v === 'object' && v) { // 对象转换
                            return this.convert(objectStructure, v);
                        } else { // 其他转换
                            return hasTrue ? ValueConverterProducer.pickValue(v, this._rules) : v;
                        }
                    });
                } else { // 其他情况，视为不转换
                    result = source;
                }
            }
        } else if (typeof structure === 'object') { // 结构定义为对象
            // 结构定义为空对象
            if (Object.keys(structure).length === 0) {
                Object.keys(source).forEach(key => {
                    if (!source[key]) { // 空值转换
                        result[key] = ValueConverterProducer.pickValue(source[key], this._rules);
                    } else if (typeof source[key] === 'object') { // 空对象会跳过非字面量转换
                        result[key] = source[key];
                    } else {
                        result[key] = ValueConverterProducer.pickValue(source[key], this._rules);
                    }
                });
            } else { // 结构定义为普通对象
                const keys = Object.keys(structure);
                const availableKeys = keys.some(v => structure[v] === false) // 根据是否包含false确定转换键
                    ? keys.filter(key => structure[key] !== false)
                    : keys.filter(key => structure[key]);
                const originalKeys = Object.keys(source);
                originalKeys.forEach(key => {
                    if (availableKeys.includes(key)) {
                        if (source[key] === null) { // 空值转换
                            result[key] = null;
                        } else if (source[key] === undefined) { // 空值转换
                            result[key] = undefined;
                        } else if (source[key] instanceof Array) { // 数组转换
                            result[key] = this.convert(structure[key], source[key]);
                        } else if (typeof source[key] === 'object') { // 递归转换对象，已确保true/false的转换
                            result[key] = this.convert(structure[key], source[key]);
                        } else { // 字面量转换
                            result[key] = ValueConverterProducer.pickValue(source[key], this._rules);
                        }
                    } else {
                        result[key] = source[key];
                    }
                });
                availableKeys.filter(key => !originalKeys.includes(key)).forEach(key => {
                    result[key] = ValueConverterProducer.pickValue(undefined, this._rules);
                });
            }
        } else { // 其他情况，因无定义视为不转换
            result = source;
        }
        return result;
    }

    private static pickValue(key: any, rules: ValueConvertRule[]): any {
        let pair = rules.find(r => typeof r.key === 'function' ? (r.key(key, this) ? true : false) : isEqual(r.key, key));
        if (!pair) {
            pair = rules.find(r => r.default === true);
        }
        if (!pair) {
            return key;
        } else if (typeof pair.value === 'function') {
            return pair.value(key, this);
        } else {
            return pair.value;
        }
    }
}
