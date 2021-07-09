"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
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
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runUserJsAndGetRaw = void 0;
var vm_1 = __importDefault(require("vm"));
var timm_1 = require("timm");
var reportUtils_1 = require("./reportUtils");
var errors_1 = require("./errors");
var debug_1 = require("./debug");
// Runs a user snippet in a sandbox, and returns the result.
// The snippet can return a Promise, which is then awaited.
// The sandbox is kept for the execution of snippets later on
// in the template. Sandboxing can also be disabled via
// ctx.options.noSandbox.
function runUserJsAndGetRaw(data, code, ctx) {
    return __awaiter(this, void 0, void 0, function () {
        var sandbox, curLoop, context, result, temp, wrapper, script, err_1, nerr;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    sandbox = timm_1.merge(ctx.jsSandbox || {}, {
                        __code__: code,
                        __result__: undefined,
                    }, data, ctx.options.additionalJsContext);
                    curLoop = reportUtils_1.getCurLoop(ctx);
                    if (curLoop)
                        sandbox.$idx = curLoop.idx;
                    Object.keys(ctx.vars).forEach(function (varName) {
                        sandbox["$" + varName] = ctx.vars[varName];
                    });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 8, , 12]);
                    if (!ctx.options.runJs) return [3 /*break*/, 3];
                    temp = ctx.options.runJs({ sandbox: sandbox, ctx: ctx });
                    context = temp.modifiedSandbox;
                    return [4 /*yield*/, temp.result];
                case 2:
                    result = _a.sent();
                    return [3 /*break*/, 7];
                case 3:
                    if (!ctx.options.noSandbox) return [3 /*break*/, 5];
                    context = sandbox;
                    wrapper = new Function('with(this) { return eval(__code__); }');
                    return [4 /*yield*/, wrapper.call(context)];
                case 4:
                    result = _a.sent();
                    return [3 /*break*/, 7];
                case 5:
                    script = new vm_1.default.Script("\n      __result__ = eval(__code__);\n      ", {});
                    context = vm_1.default.createContext(sandbox);
                    script.runInContext(context);
                    return [4 /*yield*/, context.__result__];
                case 6:
                    result = _a.sent();
                    _a.label = 7;
                case 7: return [3 /*break*/, 12];
                case 8:
                    err_1 = _a.sent();
                    if (!(ctx.options.errorHandler != null)) return [3 /*break*/, 10];
                    context = sandbox;
                    return [4 /*yield*/, ctx.options.errorHandler(err_1, code)];
                case 9:
                    result = _a.sent();
                    return [3 /*break*/, 11];
                case 10: throw new errors_1.CommandExecutionError(err_1, code);
                case 11: return [3 /*break*/, 12];
                case 12:
                    if (!(ctx.options.rejectNullish && result == null)) return [3 /*break*/, 15];
                    nerr = new errors_1.NullishCommandResultError(code);
                    if (!(ctx.options.errorHandler != null)) return [3 /*break*/, 14];
                    return [4 /*yield*/, ctx.options.errorHandler(nerr, code)];
                case 13:
                    result = _a.sent();
                    return [3 /*break*/, 15];
                case 14: throw nerr;
                case 15:
                    // Save the sandbox for later use
                    ctx.jsSandbox = timm_1.omit(context, ['__code__', '__result__']);
                    debug_1.logger.debug('JS result', { attach: result });
                    return [2 /*return*/, result];
            }
        });
    });
}
exports.runUserJsAndGetRaw = runUserJsAndGetRaw;
