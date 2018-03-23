import { ParameterDescriptor } from '../Parameter';
import { Producer } from '../Producer';
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
export declare class ValueConverterProducer extends Producer {
    private _rules;
    private _structure;
    protected _initialize(params: {
        [key: string]: any;
    }): void;
    introduce(): string;
    parameterStructure(): ParameterDescriptor;
    produce(input: any[]): any[] | Promise<any[]>;
    private convert(structure, source);
    private static pickValue(key, rules);
}
