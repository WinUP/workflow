import { isEqual } from 'lodash';

import { IParameterDescriptor, ParameterType } from '../Parameter';
import { ParameterTable } from '../ParamaterTable';
import { Producer } from '../Producer';

/**
 * Value convert rule
 */
export interface IValueConvertRule<T = any, U = any> {
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
export class ValueConvertProducer extends Producer {
    public introduce(): string {
        return 'Use given structure to focus on input data\'s specific places, then using rules to convert the value.';
    }

    public parameterStructure(): IParameterDescriptor {
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

    public produce(input: any[], params: ParameterTable): any[] | Promise<any[]> {
        const rules = params.get<IValueConvertRule[]>('rules');
        const structure = params.get<{ [key: string]: object | boolean }>('structure');
        if (!rules || !structure) {
            throw new TypeError(`Value converter ${this.id}: No rules or structure definition`);
        }
        return Promise.all(input.map(data => {
            if (data == null) {
                return null;
            } if (typeof data === 'object') {
                return ValueConvertProducer.convert(structure, data, rules);
            } else {
                return ValueConvertProducer.pickValue(data, rules);
            }
        }));
    }

    protected static async convert(structure: any, source: any, rules: IValueConvertRule[]): Promise<object | null | undefined> {
        // 空值转换
        if (source === null) {
            return ValueConvertProducer.pickValue(source, rules);
        }
        if (source === undefined) {
            return ValueConvertProducer.pickValue(source, rules);
        }
        // 结构定义为false
        if (structure === false) {
            return source;
        }
        // 输入值不为对象（此时忽略结构定义），或结构定义为true
        if (typeof source !== 'object' || structure === true) {
            return ValueConvertProducer.pickValue(source, rules);
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
                    result = await source.map(v => ValueConvertProducer.pickValue(v, rules));
                } else if (objectStructure) { // 有结构定义
                    result = await Promise.all(source.map(async v => {
                        if (typeof v === 'object' && v) { // 对象转换
                            return await ValueConvertProducer.convert(objectStructure, v, rules);
                        } else { // 其他转换
                            return hasTrue ? await ValueConvertProducer.pickValue(v, rules) : v;
                        }
                    }));
                } else { // 其他情况，视为不转换
                    result = source;
                }
            }
        } else if (typeof structure === 'object') { // 结构定义为对象
            // 结构定义为空对象
            if (Object.keys(structure).length === 0) {
                const keys = Object.keys(source);
                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i];
                    if (!source[key]) { // 空值转换
                        result[key] = await ValueConvertProducer.pickValue(source[key], rules);
                    } else if (typeof source[key] === 'object') { // 空对象会跳过非字面量转换
                        result[key] = source[key];
                    } else {
                        result[key] = await ValueConvertProducer.pickValue(source[key], rules);
                    }
                }
            } else { // 结构定义为普通对象
                const keys = Object.keys(structure);
                let availableKeys = keys.some(v => structure[v] === false) // 根据是否包含false确定转换键
                    ? keys.filter(key => structure[key] !== false)
                    : keys.filter(key => structure[key]);
                const originalKeys = Object.keys(source);
                for (let i = 0; i < originalKeys.length; i++) {
                    const key = originalKeys[i];
                    if (availableKeys.includes(key)) {
                        if (source[key] === null) { // 空值转换
                            result[key] = ValueConvertProducer.pickValue(null, rules);
                        } else if (source[key] === undefined) { // 空值转换
                            result[key] = ValueConvertProducer.pickValue(undefined, rules);
                        } else if (source[key] instanceof Array) { // 数组转换
                            result[key] = await ValueConvertProducer.convert(structure[key], source[key], rules);
                        } else if (typeof source[key] === 'object') { // 递归转换对象，已确保true/false的转换
                            result[key] = await ValueConvertProducer.convert(structure[key], source[key], rules);
                        } else { // 字面量转换
                            result[key] = await ValueConvertProducer.pickValue(source[key], rules);
                        }
                    } else {
                        result[key] = source[key];
                    }
                }
                availableKeys = availableKeys.filter(key => !originalKeys.includes(key));
                for (let i = 0; i < availableKeys.length; i++) {
                    result[availableKeys[i]] = await ValueConvertProducer.pickValue(undefined, rules);
                }
            }
        } else { // 其他情况，因无定义视为不转换
            result = source;
        }
        return result;
    }

    protected static async pickValue(key: any, rules: IValueConvertRule[]): Promise<any> {
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
