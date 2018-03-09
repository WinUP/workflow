"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Parameter_1 = require("../Parameter");
var Producer_1 = require("../Producer");
var lodash_1 = require("lodash");
/**
 * 值转换处理器
 */
var ValueConverterProducer = /** @class */ (function (_super) {
    __extends(ValueConverterProducer, _super);
    function ValueConverterProducer() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._rules = [];
        _this._structure = {};
        return _this;
    }
    ValueConverterProducer.prototype.initialize = function (params) {
        if (!(params.rules instanceof Array)) {
            throw new TypeError("Cannot create value converter: Parameter 'rules' must be Array");
        }
        this._rules = params.rules;
        if (params.structure == null) {
            throw new TypeError("Cannot create value converter: Parameter 'structure' cannot be null");
        }
        this._structure = params.structure;
    };
    ValueConverterProducer.prototype.introduce = function () {
        return 'Use given structure to focus on input data\'s specific places, then using rules to convert the value.';
    };
    ValueConverterProducer.prototype.parameterStructure = function () {
        return {
            rules: {
                type: Parameter_1.ParameterType.Array,
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
                type: Parameter_1.ParameterType.Any,
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
                    '{ data1: {} } -> convert data1\'s all children\'s value in input if input and data1 is object\n' +
                    '{ data1: true, data2: true } -> convert data1 and data2\'s value in input if input is object\n' +
                    '{ data1: [true] } -> convert data1\'s all element if data1 is array\n' +
                    '{ data1: [ { data2: {} } ] } -> convert all object in data1 using structure { data2: {} }'
            }
        };
    };
    ValueConverterProducer.prototype.produce = function (input) {
        var _this = this;
        return input.map(function (data) {
            if (data == null) {
                return null;
            }
            if (typeof data === 'object') {
                return _this.convert(_this._structure, data);
            }
            else {
                return ValueConverterProducer.pickValue(data, _this._rules);
            }
        });
    };
    ValueConverterProducer.prototype.convert = function (structure, source) {
        var _this = this;
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
        var result = {};
        // 输入值为数组且结构定义为数组
        if (source instanceof Array && structure instanceof Array) {
            // 数组定义为空，视为不转换
            if (structure.length === 0) {
                result = source;
            }
            else {
                var objectStructure_1 = structure.find(function (v) { return typeof v === 'object' && v; });
                var hasTrue_1 = structure.some(function (v) { return v === true; });
                if (!objectStructure_1 && hasTrue_1) {
                    result = source.map(function (v) { return ValueConverterProducer.pickValue(v, _this._rules); });
                }
                else if (objectStructure_1) {
                    result = source.map(function (v) {
                        if (typeof v === 'object' && v) {
                            return _this.convert(objectStructure_1, v);
                        }
                        else {
                            return hasTrue_1 ? ValueConverterProducer.pickValue(v, _this._rules) : v;
                        }
                    });
                }
                else {
                    result = source;
                }
            }
        }
        else if (typeof structure === 'object') {
            // 结构定义为空对象
            if (Object.keys(structure).length === 0) {
                Object.keys(source).forEach(function (key) {
                    if (!source[key]) {
                        result[key] = ValueConverterProducer.pickValue(source[key], _this._rules);
                    }
                    else if (typeof source[key] === 'object') {
                        result[key] = source[key];
                    }
                    else {
                        result[key] = ValueConverterProducer.pickValue(source[key], _this._rules);
                    }
                });
            }
            else {
                var keys = Object.keys(structure);
                var availableKeys_1 = keys.some(function (v) { return structure[v] === false; }) // 根据是否包含false确定转换键
                    ? keys.filter(function (key) { return structure[key] !== false; })
                    : keys.filter(function (key) { return structure[key]; });
                var originalKeys_1 = Object.keys(source);
                originalKeys_1.forEach(function (key) {
                    if (availableKeys_1.includes(key)) {
                        if (source[key] === null) {
                            result[key] = null;
                        }
                        else if (source[key] === undefined) {
                            result[key] = undefined;
                        }
                        else if (source[key] instanceof Array) {
                            result[key] = _this.convert(structure[key], source[key]);
                        }
                        else if (typeof source[key] === 'object') {
                            result[key] = _this.convert(structure[key], source[key]);
                        }
                        else {
                            result[key] = ValueConverterProducer.pickValue(source[key], _this._rules);
                        }
                    }
                    else {
                        result[key] = source[key];
                    }
                });
                availableKeys_1.filter(function (key) { return !originalKeys_1.includes(key); }).forEach(function (key) {
                    result[key] = ValueConverterProducer.pickValue(undefined, _this._rules);
                });
            }
        }
        else {
            result = source;
        }
        return result;
    };
    ValueConverterProducer.pickValue = function (key, rules) {
        var _this = this;
        var pair = rules.find(function (r) { return typeof r.key === 'function' ? (r.key(key, _this) ? true : false) : lodash_1.isEqual(r.key, key); });
        if (!pair) {
            pair = rules.find(function (r) { return r.default === true; });
        }
        if (!pair) {
            return key;
        }
        else if (typeof pair.value === 'function') {
            return pair.value(key, this);
        }
        else {
            return pair.value;
        }
    };
    return ValueConverterProducer;
}(Producer_1.Producer));
exports.ValueConverterProducer = ValueConverterProducer;
//# sourceMappingURL=ValueConverter.producer.js.map