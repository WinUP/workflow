import { SpecialParameterType } from './SpecialParameterType';

export interface ISpecialParameter<T = any> {
    type: SpecialParameterType;
    content: T;
}

const parameterTypes = [SpecialParameterType.Eval];

export function isSpecialParameter(input: any): input is ISpecialParameter {
    if (typeof input !== 'object') {
        return false;
    }
    const keys = Object.keys(input);
    if (!keys.includes('type') || !keys.includes('content')) {
        return false;
    }
    if (!parameterTypes.includes(input.type)) {
        return false;
    }
    return true;
}
