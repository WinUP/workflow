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
var Producer_1 = require("../Producer");
/**
 * Data picker producer
 */
var EmptyProducer = /** @class */ (function (_super) {
    __extends(EmptyProducer, _super);
    function EmptyProducer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    EmptyProducer.prototype.introduce = function () {
        return 'Producer that does nothing';
    };
    EmptyProducer.prototype.parameterStructure = function () {
        return {};
    };
    EmptyProducer.prototype._produce = function (input) {
        return input;
    };
    return EmptyProducer;
}(Producer_1.Producer));
exports.EmptyProducer = EmptyProducer;
//# sourceMappingURL=Empty.producer.js.map