"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ParameterTable = /** @class */ (function () {
    function ParameterTable() {
        this.storage = [];
    }
    ParameterTable.prototype.get = function (key) {
        return this.storage[key];
    };
    ParameterTable.prototype.set = function (key, value) {
        this.storage[key] = value;
        return value;
    };
    ParameterTable.prototype.remove = function (key) {
        if (this.storage[key] !== undefined) {
            delete this.storage[key];
        }
    };
    ParameterTable.prototype.clear = function () {
        this.storage = {};
    };
    ParameterTable.prototype.use = function (params) {
        this.storage = params;
    };
    ParameterTable.prototype.patch = function (params) {
        var _this = this;
        Object.keys(params).forEach(function (key) {
            _this.storage[key] = params[key];
        });
    };
    return ParameterTable;
}());
exports.ParameterTable = ParameterTable;
//# sourceMappingURL=ParamaterTable.js.map