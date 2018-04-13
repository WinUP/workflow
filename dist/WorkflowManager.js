"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
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
var util_1 = require("./util");
var Relation_1 = require("./Relation");
var Errors = require("./errors");
/**
 * Workflow manager
 */
var WorkflowManager = /** @class */ (function () {
    function WorkflowManager() {
        this._entrance = null;
        this._isRunning = false;
        this.stopInjector = null;
        this.pauseInjector = null;
        this.pendingCallback = null;
        this.pendingTrigger = null;
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
    Object.defineProperty(WorkflowManager.prototype, "isRunning", {
        /**
         * Indicate if workflow is running
         */
        get: function () {
            return this._isRunning;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Load workflow fronm definitions
     * @param activator A function that using given type string and return an instance of ```Producer```
     * or ```null``` (if cannot instancing ```Producer```)
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
                    throw new Errors.ConflictError("Cannot set " + definition.entrance + " as entrance point: Entrance has already set to " + entranceId);
                }
                entranceId = definition.entrance;
            }
            if (definition.producers) {
                definition.producers.forEach(function (producer) {
                    if (producers.some(function (p) { return p.id === producer.id; })) {
                        throw new Errors.ConflictError("Cannot add producer " + producer.id + ": Id conflict");
                    }
                    var instanceActivator = activator(producer.type);
                    if (!instanceActivator) {
                        throw new TypeError("Cannot declare producer " + producer.id + ": Activator returns nothing");
                    }
                    var instance = new instanceActivator(producer.id);
                    instance.initialize(producer.parameters);
                    producers.push(instance);
                });
            }
            if (definition.relations) {
                definition.relations.forEach(function (relation) {
                    if (relations.some(function (r) { return r.from === relation.from && r.to === relation.to; })) {
                        throw new Errors.ConflictError("Cannot register relation: " + relation.from + " -> " + relation.to + " is already exist");
                    }
                    relations.push(relation);
                });
            }
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
                throw new ReferenceError("Cannot add relation " + relation.from + " -> " + relation.to + ": Child with id " + relation.to + " is not exist");
            }
            from.relation(new Relation_1.Relation(from, to, relation.inject, relation.condition || undefined));
        });
        var result = new WorkflowManager();
        result.entrance = entrance;
        return result;
    };
    /**
     * Stop workflow. Workflow will not stop immediately but stop before process next ```Producer```,
     * current running ```Producer``` cannot be stopped.
     * @throws {UnavailableError} Workflow is not running.
     * @throws {ConflictError} Workflow is in stopping progress.
     */
    WorkflowManager.prototype.stop = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        if (_this._isRunning && _this.stopInjector == null) {
                            _this.stopInjector = function () { return resolve(); };
                            if (_this.pendingTrigger != null) {
                                _this.resume();
                            }
                        }
                        else if (!_this._isRunning) {
                            reject(new Errors.UnavailableError('Workflow is not running'));
                        }
                        else {
                            reject(new Errors.ConflictError('Workflow is in stopping progress'));
                        }
                    })];
            });
        });
    };
    /**
     * Pause workflow. Workflow will not pause immediately but pause before process next ```Producer```,
     * current running ```Producer``` will continue run until it finished.
     * @throws {UnavailableError} Workflow is not running.
     * @throws {ConflictError} Workflow is in pausing progress.
     */
    WorkflowManager.prototype.pause = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        if (_this._isRunning && _this.pauseInjector == null) {
                            _this.pauseInjector = function () { return resolve(); };
                            _this.pendingCallback = new Promise(function (callback) { _this.pendingTrigger = function () { return callback(); }; });
                        }
                        else if (!_this._isRunning) {
                            reject(new Errors.UnavailableError('Workflow is not running'));
                        }
                        else {
                            reject(new Errors.ConflictError('Workflow is in pausing progress'));
                        }
                    })];
            });
        });
    };
    /**
     * Resume workflow.
     * @throws {UnavailableError} Workflow is not running or not paused.
     */
    WorkflowManager.prototype.resume = function () {
        if (this._isRunning && this.pendingTrigger != null) {
            this.pendingTrigger();
            this.pendingTrigger = null;
        }
        else if (!this._isRunning) {
            throw new Errors.UnavailableError('Workflow is not running');
        }
        else {
            throw new Errors.UnavailableError('Workflow is not paused');
        }
    };
    /**
     * Run this workflow
     * @param input Input data
     * @returns An array contains each ```Producer```'s result. Regurally last one is the last ```Producer```'s result.
     */
    WorkflowManager.prototype.run = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var running, finished, skipped, dataPool, _loop_1, this_1, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this._entrance == null) {
                            throw new Errors.UnavailableError('Cannot run workflow: No entrance point');
                        }
                        running = [{ producer: this._entrance, data: [input], inject: {} }];
                        finished = [];
                        skipped = [];
                        dataPool = [];
                        this._isRunning = true;
                        _loop_1 = function () {
                            var nextRound, _loop_2, i, state_1;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        nextRound = [];
                                        _loop_2 = function (i) {
                                            var runner, error_1, data_1, existedRunner;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0:
                                                        if (!this_1.pauseInjector) return [3 /*break*/, 2];
                                                        this_1.pauseInjector();
                                                        this_1.pauseInjector = null;
                                                        return [4 /*yield*/, this_1.pendingCallback];
                                                    case 1:
                                                        _a.sent();
                                                        this_1.pendingCallback = null;
                                                        _a.label = 2;
                                                    case 2:
                                                        if (this_1.stopInjector) { // 在每个循环开始时确定是否被终止，此时直接跳出循环，running长度一定为0
                                                            this_1.stopInjector();
                                                            return [2 /*return*/, "break"];
                                                        }
                                                        runner = running[i];
                                                        if (!(!nextRound.some(function (r) { return r.producer === runner.producer; }) && runner.producer.fitCondition(finished, skipped))) return [3 /*break*/, 4];
                                                        error_1 = null;
                                                        return [4 /*yield*/, util_1.asPromise(runner.producer.produce(runner.data, runner.inject)).catch(function (e) { return error_1 = e; })];
                                                    case 3:
                                                        data_1 = _a.sent();
                                                        if (error_1) {
                                                            throw error_1;
                                                        }
                                                        finished.push(runner.producer); // 标记执行完成
                                                        dataPool.push({ producer: runner.producer, data: data_1 }); // 记录执行结果
                                                        // 处理所有子节点
                                                        runner.producer.children.forEach(function (child) {
                                                            var suitableResult = data_1.filter(function (r) { return child.judge(r); });
                                                            if (suitableResult.length > 0) {
                                                                // 从下一轮执行队列中寻找目标节点
                                                                var newRunner = nextRound.find(function (r) { return r.producer === child.to; });
                                                                if (!newRunner) { // 没有则新建执行要求
                                                                    newRunner = { producer: child.to, data: [], inject: {} };
                                                                    nextRound.push(newRunner);
                                                                }
                                                                if (child.inject) { // 参数注入情况
                                                                    newRunner.inject[child.inject] = suitableResult[0];
                                                                }
                                                                else { // 普通数据传递
                                                                    newRunner.data = newRunner.data.concat(suitableResult);
                                                                }
                                                            }
                                                            else {
                                                                // 满足条件的数据不存在视为跳过目标节点
                                                                WorkflowManager.skipProducer(child.to, skipped);
                                                            }
                                                        });
                                                        return [3 /*break*/, 5];
                                                    case 4:
                                                        existedRunner = nextRound.find(function (r) { return r.producer === runner.producer; });
                                                        if (existedRunner) {
                                                            existedRunner.data = existedRunner.data.concat(runner.data);
                                                            existedRunner.inject = __assign({}, existedRunner.inject, runner.inject);
                                                        }
                                                        else {
                                                            nextRound.push(runner);
                                                        }
                                                        _a.label = 5;
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
                                        state_1 = _a.sent();
                                        if (state_1 === "break")
                                            return [3 /*break*/, 4];
                                        _a.label = 3;
                                    case 3:
                                        i++;
                                        return [3 /*break*/, 1];
                                    case 4:
                                        running = nextRound;
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _a.label = 1;
                    case 1:
                        if (!(running.length > 0)) return [3 /*break*/, 3];
                        return [5 /*yield**/, _loop_1()];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 1];
                    case 3:
                        result = { data: dataPool, finished: this.stopInjector == null };
                        this.stopInjector = null;
                        this._isRunning = false;
                        return [2 /*return*/, result];
                }
            });
        });
    };
    /**
     * Validate current workflow to find any unreachable producers.
     */
    WorkflowManager.prototype.validate = function () {
        if (this._entrance) {
            var touchable_1 = [this._entrance];
            var allNode = [];
            this.generateMap(this._entrance, 'down', touchable_1, allNode);
            return allNode.filter(function (node) { return !touchable_1.includes(node); });
        }
        else {
            return [];
        }
    };
    WorkflowManager.prototype.generateMap = function (entrance, searchDirection, touchable, allNode) {
        var _this = this;
        if (!allNode.includes(entrance)) {
            allNode.push(entrance);
        }
        if (searchDirection === 'down' || searchDirection === 'both') {
            entrance.children.filter(function (child) { return !touchable.includes(child.to); }).forEach(function (child) {
                touchable.push(child.to);
                _this.generateMap(child.to, 'both', touchable, allNode);
            });
        }
        if (searchDirection === 'up' || searchDirection === 'both') {
            entrance.parents.forEach(function (parent) {
                _this.generateMap(parent.from, 'up', touchable, allNode);
            });
        }
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