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
 * Data picker producer
 */
var DataPickerProducer = /** @class */ (function (_super) {
    __extends(DataPickerProducer, _super);
    function DataPickerProducer() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._query = [];
        return _this;
    }
    DataPickerProducer.prototype._initialize = function (params) {
        if (typeof params.query !== 'string') {
            throw new TypeError("Cannot create data picker: Parameter 'query' must be string");
        }
        this._query = JPQuery.analyse(params.query);
    };
    DataPickerProducer.prototype.introduce = function () {
        return 'Pick data from json object or array using JPQuery, if query string not starts with /, it will be copy to output.\n' +
            'Example: "/data1" -> data1';
    };
    DataPickerProducer.prototype.parameterStructure = function () {
        return {
            query: {
                type: Parameter_1.ParameterType.String,
                optional: false,
                description: 'JPQuery query string, see @ekifvk/jpquery\'s document on npm to learn how to use'
            }
        };
    };
    DataPickerProducer.prototype.produce = function (input) {
        var _this = this;
        return input.map(function (data) { return JPQuery.pick(data, _this._query); });
    };
    return DataPickerProducer;
}(Producer_1.Producer));
exports.DataPickerProducer = DataPickerProducer;
//# sourceMappingURL=DataPicker.producer.js.map