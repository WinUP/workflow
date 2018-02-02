"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var UUID = require("uuid");
/**
 * Workflow producer
 */
var Producer = /** @class */ (function () {
    /**
     * Decalre a workflow producer
     * @param id Producer's id. If not given, a UUID will be used instead.
     */
    function Producer(id) {
        this._parents = [];
        this._children = [];
        this._id = id ? id : UUID.v4().toUpperCase();
    }
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
    Producer.prototype.isRunningConditionSatisfied = function (finishedProducers, skippedProducers) {
        if (this.isRoot) {
            return true;
        }
        if (this._parents.some(function (p) { return !skippedProducers.includes(p.from) && !finishedProducers.includes(p.from); })) {
            return false;
        }
        return true;
    };
    return Producer;
}());
exports.Producer = Producer;
//# sourceMappingURL=Producer.js.map