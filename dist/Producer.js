"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Definition_1 = require("./Definition");
var ParamaterTable_1 = require("./ParamaterTable");
var UUID = require("uuid");
/**
 * Workflow producer
 */
var Producer = /** @class */ (function () {
    /**
     * Decalre a workflow producer
     * @param id Producer's id. If not given, an UUID will be created instead.
     */
    function Producer(id) {
        this._parameters = new ParamaterTable_1.ParameterTable();
        this._parents = [];
        this._children = [];
        this._id = id ? id : UUID.v4().toUpperCase();
    }
    Object.defineProperty(Producer.prototype, "parameters", {
        /**
         * Get producer's parameter table
         */
        get: function () {
            return this._parameters;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Producer.prototype, "parents", {
        /**
         * Get producer's parents
         */
        get: function () {
            return this._parents;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Producer.prototype, "children", {
        /**
         * Get producer's children
         */
        get: function () {
            return this._children;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Producer.prototype, "id", {
        /**
         * Get producer's ID
         */
        get: function () {
            return this._id;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Producer.prototype, "isRoot", {
        /**
         * Indicate if producer has no parent
         */
        get: function () {
            return this._parents.length === 0;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Producer.prototype, "isYoungest", {
        /**
         * Indicate if producer has no children
         */
        get: function () {
            return this._children.length === 0;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Indicate if target producer if this producer's parent
     * @param parent Target producer
     */
    Producer.prototype.isBelongsTo = function (parent) {
        return this._parents.some(function (p) { return p.from === parent; });
    };
    /**
     * Indicate if this producer is target producer's parent
     * @param child Target producer
     */
    Producer.prototype.isParentOf = function (child) {
        return this._children.some(function (c) { return c.to === child; });
    };
    /**
     * Add a relation
     * @param relation Target relation
     */
    Producer.prototype.relation = function (relation) {
        if (relation.from === this) {
            this._children.push(relation);
            relation.to._parents.push(relation);
        }
        else if (relation.to === this) {
            this._parents.push(relation);
            relation.from._children.push(relation);
        }
        else {
            throw new ReferenceError("Cannot add relation to " + this.id + ": Relation has no target mentioned this producer");
        }
        return this;
    };
    /**
     * Delete a relation
     * @param target Target relation
     */
    Producer.prototype.breakRelation = function (target) {
        var _this = this;
        if (this.isBelongsTo(target)) {
            this._parents.splice(this._parents.findIndex(function (p) { return p.from === target; }));
            target._children.splice(target._children.findIndex(function (c) { return c.to === _this; }));
        }
        else if (this.isParentOf(target)) {
            this._children.splice(this._children.findIndex(function (c) { return c.to === target; }));
            target._parents.splice(target._parents.findIndex(function (p) { return p.from === _this; }));
        }
        else {
            throw new ReferenceError("Cannot break link between " + this.id + " and " + target.id + ": No relationship existed");
        }
        return this;
    };
    /**
     * Indicate if producer's running conditions are all be satisfied
     * @param finishedProducers Producers that already finished running
     * @param skippedProducers Producers that will not run anymore
     */
    Producer.prototype.fitCondition = function (finishedProducers, skippedProducers) {
        if (this.isRoot) {
            return true;
        }
        if (this._parents.some(function (p) { return !skippedProducers.includes(p.from) && !finishedProducers.includes(p.from); })) {
            return false;
        }
        return true;
    };
    /**
     * Initialize producer
     * @param params Parameter list
     */
    Producer.prototype.initialize = function (params) {
        var result = Producer.parseParams(params);
        result = this.checkParameters(result);
        this.parameters.use(result);
    };
    /**
     * Run this producer
     * @param input Input data
     */
    Producer.prototype.produce = function (input, params) {
        var _this = this;
        var keys = Object.keys(params);
        if (keys.length === 0) {
            return this._produce(input);
        }
        else {
            var cache_1 = {};
            keys.forEach(function (key) { return cache_1[key] = _this.parameters.get(key); });
            this.parameters.patch(this.checkParameters(params));
            var output = this._produce(input);
            this.parameters.patch(cache_1);
            return output;
        }
    };
    Producer.prototype.checkParameters = function (params) {
        return params;
    };
    Producer.parseParams = function (params) {
        if (Definition_1.isSpecialParameter(params)) {
            if (params.type === Definition_1.SpecialParameterType.Eval) {
                params = eval(params.content);
            }
        }
        if (!(typeof params === 'object')) {
            return params;
        }
        var result = {};
        Object.keys(params).forEach(function (key) {
            if (params[key] instanceof Array) {
                result[key] = params[key].map(function (v) { return Producer.parseParams(v); });
            }
            else if (typeof params[key] === 'object') {
                result[key] = Producer.parseParams(params[key]);
            }
            else {
                result[key] = params[key];
            }
        });
        return result;
    };
    return Producer;
}());
exports.Producer = Producer;
//# sourceMappingURL=Producer.js.map