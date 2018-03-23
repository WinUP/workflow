"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SpecialParameterType;
(function (SpecialParameterType) {
    SpecialParameterType["Eval"] = "eval";
})(SpecialParameterType = exports.SpecialParameterType || (exports.SpecialParameterType = {}));
var parameterTypes = [SpecialParameterType.Eval];
function isSpecialParameter(input) {
    if (typeof input !== 'object') {
        return false;
    }
    var keys = Object.keys(input);
    if (!keys.includes('type') || !keys.includes('content')) {
        return false;
    }
    if (!parameterTypes.includes(input.type)) {
        return false;
    }
    return true;
}
exports.isSpecialParameter = isSpecialParameter;
//# sourceMappingURL=Definition.js.map