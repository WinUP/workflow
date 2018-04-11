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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
        return _super !== null && _super.apply(this, arguments) || this;
    }
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
                    '{ data1: {} } -> convert data1\'s all level 1 children\'s value in input if input and data1 is object\n' +
                    '{ data1: true, data2: true } -> convert data1 and data2\'s value in input if input is object\n' +
                    '{ data1: [true] } -> convert data1\'s all elements if data1 is array\n' +
                    '{ data1: [ { data2: {} } ] } -> convert all objects in data1 using structure { data2: {} }'
            }
        };
    };
    ValueConverterProducer.prototype._produce = function (input) {
        var rules = this.parameters.get('rules');
        var structure = this.parameters.get('structure');
        if (!rules || !structure) {
            throw new TypeError("Value converter " + this.id + ": No rules or structure definition");
        }
        return Promise.all(input.map(function (data) {
            if (data == null) {
                return null;
            }
            if (typeof data === 'object') {
                return ValueConverterProducer.convert(structure, data, rules);
            }
            else {
                return ValueConverterProducer.pickValue(data, rules);
            }
        }));
    };
    ValueConverterProducer.convert = function (structure, source, rules) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var result, objectStructure_1, hasTrue_1, keys, i, key, _a, _b, _c, _d, keys, availableKeys, originalKeys_1, i, key, _e, _f, _g, _h, _j, _k, i, _l, _m;
            return __generator(this, function (_o) {
                switch (_o.label) {
                    case 0:
                        // 空值转换
                        if (source === null) {
                            return [2 /*return*/, ValueConverterProducer.pickValue(source, rules)];
                        }
                        if (source === undefined) {
                            return [2 /*return*/, ValueConverterProducer.pickValue(source, rules)];
                        }
                        // 结构定义为false
                        if (structure === false) {
                            return [2 /*return*/, source];
                        }
                        // 输入值不为对象（此时忽略结构定义），或结构定义为true
                        if (typeof source !== 'object' || structure === true) {
                            return [2 /*return*/, ValueConverterProducer.pickValue(source, rules)];
                        }
                        result = {};
                        if (!(source instanceof Array && structure instanceof Array)) return [3 /*break*/, 7];
                        if (!(structure.length === 0)) return [3 /*break*/, 1];
                        result = source;
                        return [3 /*break*/, 6];
                    case 1:
                        objectStructure_1 = structure.find(function (v) { return typeof v === 'object' && v; });
                        hasTrue_1 = structure.some(function (v) { return v === true; });
                        if (!(!objectStructure_1 && hasTrue_1)) return [3 /*break*/, 3];
                        return [4 /*yield*/, source.map(function (v) { return ValueConverterProducer.pickValue(v, rules); })];
                    case 2:
                        result = _o.sent();
                        return [3 /*break*/, 6];
                    case 3:
                        if (!objectStructure_1) return [3 /*break*/, 5];
                        return [4 /*yield*/, Promise.all(source.map(function (v) { return __awaiter(_this, void 0, void 0, function () {
                                var _a;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            if (!(typeof v === 'object' && v)) return [3 /*break*/, 2];
                                            return [4 /*yield*/, ValueConverterProducer.convert(objectStructure_1, v, rules)];
                                        case 1: // 对象转换
                                        return [2 /*return*/, _b.sent()];
                                        case 2:
                                            if (!hasTrue_1) return [3 /*break*/, 4];
                                            return [4 /*yield*/, ValueConverterProducer.pickValue(v, rules)];
                                        case 3:
                                            _a = _b.sent();
                                            return [3 /*break*/, 5];
                                        case 4:
                                            _a = v;
                                            _b.label = 5;
                                        case 5: // 其他转换
                                        return [2 /*return*/, _a];
                                    }
                                });
                            }); }))];
                    case 4:
                        result = _o.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        result = source;
                        _o.label = 6;
                    case 6: return [3 /*break*/, 33];
                    case 7:
                        if (!(typeof structure === 'object')) return [3 /*break*/, 32];
                        if (!(Object.keys(structure).length === 0)) return [3 /*break*/, 15];
                        keys = Object.keys(source);
                        i = 0;
                        _o.label = 8;
                    case 8:
                        if (!(i < keys.length)) return [3 /*break*/, 14];
                        key = keys[i];
                        if (!!source[key]) return [3 /*break*/, 10];
                        _a = result;
                        _b = key;
                        return [4 /*yield*/, ValueConverterProducer.pickValue(source[key], rules)];
                    case 9:
                        _a[_b] = _o.sent();
                        return [3 /*break*/, 13];
                    case 10:
                        if (!(typeof source[key] === 'object')) return [3 /*break*/, 11];
                        result[key] = source[key];
                        return [3 /*break*/, 13];
                    case 11:
                        _c = result;
                        _d = key;
                        return [4 /*yield*/, ValueConverterProducer.pickValue(source[key], rules)];
                    case 12:
                        _c[_d] = _o.sent();
                        _o.label = 13;
                    case 13:
                        i++;
                        return [3 /*break*/, 8];
                    case 14: return [3 /*break*/, 31];
                    case 15:
                        keys = Object.keys(structure);
                        availableKeys = keys.some(function (v) { return structure[v] === false; }) // 根据是否包含false确定转换键
                            ? keys.filter(function (key) { return structure[key] !== false; })
                            : keys.filter(function (key) { return structure[key]; });
                        originalKeys_1 = Object.keys(source);
                        i = 0;
                        _o.label = 16;
                    case 16:
                        if (!(i < originalKeys_1.length)) return [3 /*break*/, 27];
                        key = originalKeys_1[i];
                        if (!availableKeys.includes(key)) return [3 /*break*/, 25];
                        if (!(source[key] === null)) return [3 /*break*/, 17];
                        result[key] = ValueConverterProducer.pickValue(null, rules);
                        return [3 /*break*/, 24];
                    case 17:
                        if (!(source[key] === undefined)) return [3 /*break*/, 18];
                        result[key] = ValueConverterProducer.pickValue(undefined, rules);
                        return [3 /*break*/, 24];
                    case 18:
                        if (!(source[key] instanceof Array)) return [3 /*break*/, 20];
                        _e = result;
                        _f = key;
                        return [4 /*yield*/, ValueConverterProducer.convert(structure[key], source[key], rules)];
                    case 19:
                        _e[_f] = _o.sent();
                        return [3 /*break*/, 24];
                    case 20:
                        if (!(typeof source[key] === 'object')) return [3 /*break*/, 22];
                        _g = result;
                        _h = key;
                        return [4 /*yield*/, ValueConverterProducer.convert(structure[key], source[key], rules)];
                    case 21:
                        _g[_h] = _o.sent();
                        return [3 /*break*/, 24];
                    case 22:
                        _j = result;
                        _k = key;
                        return [4 /*yield*/, ValueConverterProducer.pickValue(source[key], rules)];
                    case 23:
                        _j[_k] = _o.sent();
                        _o.label = 24;
                    case 24: return [3 /*break*/, 26];
                    case 25:
                        result[key] = source[key];
                        _o.label = 26;
                    case 26:
                        i++;
                        return [3 /*break*/, 16];
                    case 27:
                        availableKeys = availableKeys.filter(function (key) { return !originalKeys_1.includes(key); });
                        i = 0;
                        _o.label = 28;
                    case 28:
                        if (!(i < availableKeys.length)) return [3 /*break*/, 31];
                        _l = result;
                        _m = availableKeys[i];
                        return [4 /*yield*/, ValueConverterProducer.pickValue(undefined, rules)];
                    case 29:
                        _l[_m] = _o.sent();
                        _o.label = 30;
                    case 30:
                        i++;
                        return [3 /*break*/, 28];
                    case 31: return [3 /*break*/, 33];
                    case 32:
                        result = source;
                        _o.label = 33;
                    case 33: return [2 /*return*/, result];
                }
            });
        });
    };
    ValueConverterProducer.pickValue = function (key, rules) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var pair;
            return __generator(this, function (_a) {
                pair = rules.find(function (r) { return typeof r.key === 'function' ? (r.key(key, _this) ? true : false) : lodash_1.isEqual(r.key, key); });
                if (!pair) {
                    pair = rules.find(function (r) { return r.default === true; });
                }
                if (!pair) {
                    return [2 /*return*/, key];
                }
                else if (typeof pair.value === 'function') {
                    return [2 /*return*/, pair.value(key, this)];
                }
                else {
                    return [2 /*return*/, pair.value];
                }
                return [2 /*return*/];
            });
        });
    };
    return ValueConverterProducer;
}(Producer_1.Producer));
exports.ValueConverterProducer = ValueConverterProducer;
//# sourceMappingURL=ValueConverter.producer.js.map