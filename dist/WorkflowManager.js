"use strict";
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
var Relation_1 = require("./Relation");
/**
 * Workflow manager
 */
var WorkflowManager = /** @class */ (function () {
    function WorkflowManager() {
        this._entrance = null;
    }
    Object.defineProperty(WorkflowManager.prototype, "entrance", {
        /**
         * Entrance producer
         */
        get: function () {
            return this._entrance;
        },
        set: function (value) {
            this._entrance = value;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Load workflow fronm definitions
     * @param activator A function that using given type string and return an instance of Producer or null (if cannot declare producer)
     * @param definitions All workflow definitions
     */
    WorkflowManager.fromDefinitions = function (activator) {
        var definitions = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            definitions[_i - 1] = arguments[_i];
        }
        var producers = [];
        var relations = [];
        var entranceId = null;
        definitions.forEach(function (definition) {
            if (definition.entrance) {
                if (entranceId) {
                    throw new TypeError("Cannot set " + definition.entrance + " as entrance point: Entrance has already set to " + entranceId);
                }
                entranceId = definition.entrance;
            }
            definition.producers.forEach(function (producer) {
                if (producers.some(function (p) { return p.id === producer.id; })) {
                    throw new TypeError("Cannot add producer " + producer.id + ": Id conflict");
                }
                var instanceActivator = activator(producer.type);
                if (!instanceActivator) {
                    throw new ReferenceError("Cannot declare producer " + producer.id + ": Activator returns nothing");
                }
                var instance = new instanceActivator(producer.id);
                instance.initialize.apply(instance, producer.parameters);
                producers.push(instance);
            });
            definition.relations.forEach(function (relation) {
                if (relations.some(function (r) { return r.from === relation.from && r.to === relation.to; })) {
                    throw new TypeError("Cannot register relation: " + relation.from + " -> " + relation.to + " is already exist");
                }
                relations.push(relation);
            });
        });
        var entrance = producers.find(function (p) { return p.id === entranceId; });
        if (!entrance) {
            throw new ReferenceError("Cannot generate workflow: No entrance point (prefer id " + entranceId + ")");
        }
        relations.forEach(function (relation) {
            var from = producers.find(function (p) { return p.id === relation.from; });
            if (!from) {
                throw new ReferenceError("Cannot add relation " + relation.from + " -> " + relation.to + ": Parent with id " + relation.from + " is not exist");
            }
            var to = producers.find(function (p) { return p.id === relation.to; });
            if (!to) {
                throw new ReferenceError("Cannot add relation " + relation.from + " -> " + relation.to + ": Child with id " + relation.from + " is not exist");
            }
            from.relation(new Relation_1.Relation(from, to, relation.condition ? relation.condition : undefined));
        });
        var result = new WorkflowManager();
        result.entrance = entrance;
        return result;
    };
    /**
     * Run this workflow
     * @param input Input data
     * @returns An array contains each producer's result. Regurally last one is the last producer's result.
     */
    WorkflowManager.prototype.run = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var running, finished, skipped, dataPool, _loop_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this._entrance == null) {
                            throw new ReferenceError('Cannot run workflow: No entrance point');
                        }
                        running = [{ producer: this._entrance, data: [input] }];
                        finished = [];
                        skipped = [];
                        dataPool = [];
                        _loop_1 = function () {
                            var afterRunning, _loop_2, i;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        afterRunning = [];
                                        _loop_2 = function (i) {
                                            var runner, result, syncResult_1, _a;
                                            return __generator(this, function (_b) {
                                                switch (_b.label) {
                                                    case 0:
                                                        runner = running[i];
                                                        if (!runner.producer.isRunningConditionSatisfied(finished, skipped)) return [3 /*break*/, 4];
                                                        result = runner.producer.produce(runner.data);
                                                        if (!(result instanceof Promise)) return [3 /*break*/, 2];
                                                        return [4 /*yield*/, result];
                                                    case 1:
                                                        _a = _b.sent();
                                                        return [3 /*break*/, 3];
                                                    case 2:
                                                        _a = result;
                                                        _b.label = 3;
                                                    case 3:
                                                        syncResult_1 = _a;
                                                        finished.push(runner.producer);
                                                        dataPool.push({ producer: runner.producer, data: syncResult_1 });
                                                        runner.producer.children.forEach(function (child) {
                                                            var suitableResult = syncResult_1.filter(function (r) { return child.judge(r); });
                                                            if (suitableResult.length > 0) {
                                                                var newRunner = afterRunning.find(function (r) { return r.producer === child.to; });
                                                                if (!newRunner) {
                                                                    newRunner = { producer: child.to, data: [] };
                                                                    afterRunning.push(newRunner);
                                                                }
                                                                newRunner.data = newRunner.data.concat(suitableResult);
                                                            }
                                                            else {
                                                                WorkflowManager.skipProducer(child.to, skipped);
                                                            }
                                                        });
                                                        return [3 /*break*/, 5];
                                                    case 4:
                                                        afterRunning.push(runner);
                                                        _b.label = 5;
                                                    case 5: return [2 /*return*/];
                                                }
                                            });
                                        };
                                        i = 0;
                                        _a.label = 1;
                                    case 1:
                                        if (!(i < running.length)) return [3 /*break*/, 4];
                                        return [5 /*yield**/, _loop_2(i)];
                                    case 2:
                                        _a.sent();
                                        _a.label = 3;
                                    case 3:
                                        i++;
                                        return [3 /*break*/, 1];
                                    case 4:
                                        running = afterRunning;
                                        return [2 /*return*/];
                                }
                            });
                        };
                        _a.label = 1;
                    case 1:
                        if (!(running.length > 0)) return [3 /*break*/, 3];
                        return [5 /*yield**/, _loop_1()];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 1];
                    case 3: return [2 /*return*/, dataPool];
                }
            });
        });
    };
    WorkflowManager.skipProducer = function (target, skipped) {
        skipped.push(target);
        target.children.forEach(function (child) {
            if (child.to.parents.every(function (p) { return skipped.includes(p.from); })) {
                WorkflowManager.skipProducer(child.to, skipped);
            }
        });
    };
    return WorkflowManager;
}());
exports.WorkflowManager = WorkflowManager;
//# sourceMappingURL=WorkflowManager.js.map