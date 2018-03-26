"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Workflow relation
 */
var Relation = /** @class */ (function () {
    function Relation(from, to, inject, code) {
        if (code === void 0) { code = function () { return true; }; }
        this._from = from;
        this._to = to;
        this._inject = inject;
        this._code = code;
    }
    Object.defineProperty(Relation.prototype, "from", {
        /**
         * Get relation's parent producer
         */
        get: function () {
            return this._from;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Relation.prototype, "to", {
        /**
         * Get relation's child producer
         */
        get: function () {
            return this._to;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Relation.prototype, "code", {
        /**
         * Get relation's condition
         */
        get: function () {
            return this._code;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Relation.prototype, "inject", {
        /**
         * Get relation's inject parameter name
         * @description Inject parameter means data transfered by this relation will be inject to producer as a
         * temporaty "initialize" parameter only for this round of produce.
         */
        get: function () {
            return this._inject;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Test the condition
     * @param input Data using in this test
     */
    Relation.prototype.judge = function (input) {
        try {
            if (typeof this._code === 'string') {
                return eval("(function(input){" + this._code + "})(input)") ? true : false;
            }
            else {
                return this._code(input) ? true : false;
            }
        }
        catch (error) {
            throw EvalError("Cannot run code under relation " + this._from.id + " -> " + this._to.id + ": " + error);
        }
    };
    return Relation;
}());
exports.Relation = Relation;
//# sourceMappingURL=Relation.js.map