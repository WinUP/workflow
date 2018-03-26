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
var JPQuery = require("@ekifvk/jpquery");
/**
 * Structured data picker producer
 */
var StructuredDataPickerProducer = /** @class */ (function (_super) {
    __extends(StructuredDataPickerProducer, _super);
    function StructuredDataPickerProducer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    StructuredDataPickerProducer.prototype.introduce = function () {
        return 'Pick data from json object or array using JPQuery using given structure. ' +
            'if any query string not starts with /, it will be copy to output\'s same place. ' +
            'Different places\'s query string will be put to output structure\s same place, even in object and array.\n' +
            'Example: { a: "/data1", b: [ "/data2", "/data3" ] } -> { a: data1, b: [ data2, data3 ] }';
    };
    StructuredDataPickerProducer.prototype.parameterStructure = function () {
        return {
            query: {
                type: Parameter_1.ParameterType.Array | Parameter_1.ParameterType.Object,
                optional: false,
                description: 'An object or array that all value should be object/array/query string. ' +
                    'See @ekifvk/jpquery\'s document on npm to learn how to use'
            }
        };
    };
    StructuredDataPickerProducer.prototype._produce = function (input) {
        var query = this.parameters.get('query');
        if (!query) {
            throw new TypeError("Data picker " + this.id + ": No query structure");
        }
        return input.map(function (data) { return StructuredDataPickerProducer.pickData(query, data); });
    };
    StructuredDataPickerProducer.pickData = function (input, source) {
        var _this = this;
        if (input instanceof Array) {
            return input.map(function (v) { return _this.pickData(v, source); });
        }
        else if (input == null) {
            return null;
        }
        else if (typeof input !== 'object') {
            if (typeof input === 'string') {
                return input.startsWith('/') ? JPQuery.pick(source, JPQuery.analyse(input)) : input;
            }
            else {
                return input;
            }
        }
        else {
            var result_1 = {};
            Object.keys(input).forEach(function (key) {
                if (input[key] == null) {
                    result_1[key] = null;
                }
                else if (typeof input[key] === 'object') {
                    result_1[key] = _this.pickData(input[key], source);
                }
                else if (typeof input[key] === 'string') {
                    result_1[key] = input[key].startsWith('/')
                        ? JPQuery.pick(source, JPQuery.analyse(input[key]))
                        : input[key];
                }
                else {
                    result_1[key] = input[key];
                }
            });
            return result_1;
        }
    };
    return StructuredDataPickerProducer;
}(Producer_1.Producer));
exports.StructuredDataPickerProducer = StructuredDataPickerProducer;
//# sourceMappingURL=StructuredDataPicker.producer.js.map