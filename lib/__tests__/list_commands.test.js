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
var path_1 = __importDefault(require("path"));
var fs_1 = __importDefault(require("fs"));
var main_1 = require("../main");
describe('listCommands', function () {
    it('handles simple INS', function () { return __awaiter(void 0, void 0, void 0, function () {
        var template, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'noQuerySimpleInserts.docx'))];
                case 1:
                    template = _b.sent();
                    _a = expect;
                    return [4 /*yield*/, main_1.listCommands(template)];
                case 2:
                    _a.apply(void 0, [_b.sent()]).toEqual([
                        { raw: 'INS a', code: 'a', type: 'INS' },
                        { raw: 'ins b', code: 'b', type: 'INS' },
                    ]);
                    return [2 /*return*/];
            }
        });
    }); });
    it('handles IMAGE', function () { return __awaiter(void 0, void 0, void 0, function () {
        var template, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'imagesSVG.docx'))];
                case 1:
                    template = _b.sent();
                    _a = expect;
                    return [4 /*yield*/, main_1.listCommands(template, '+++')];
                case 2:
                    _a.apply(void 0, [_b.sent()]).toEqual([
                        { raw: 'IMAGE svgImgFile()', code: 'svgImgFile()', type: 'IMAGE' },
                        { raw: 'IMAGE svgImgStr()', code: 'svgImgStr()', type: 'IMAGE' },
                    ]);
                    return [2 /*return*/];
            }
        });
    }); });
    it('handles inline FOR loops', function () { return __awaiter(void 0, void 0, void 0, function () {
        var template, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'for1inline.docx'))];
                case 1:
                    template = _b.sent();
                    _a = expect;
                    return [4 /*yield*/, main_1.listCommands(template)];
                case 2:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n      Array [\n        Object {\n          \"code\": \"company IN companies\",\n          \"raw\": \"FOR company IN companies\",\n          \"type\": \"FOR\",\n        },\n        Object {\n          \"code\": \"$company.name\",\n          \"raw\": \"INS $company.name\",\n          \"type\": \"INS\",\n        },\n        Object {\n          \"code\": \"company\",\n          \"raw\": \"END-FOR company\",\n          \"type\": \"END-FOR\",\n        },\n      ]\n    ");
                    return [2 /*return*/];
            }
        });
    }); });
    it('handles IF clausess', function () { return __awaiter(void 0, void 0, void 0, function () {
        var template, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'if2.docx'))];
                case 1:
                    template = _b.sent();
                    _a = expect;
                    return [4 /*yield*/, main_1.listCommands(template)];
                case 2:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n      Array [\n        Object {\n          \"code\": \"4 > 3\",\n          \"raw\": \"IF 4 > 3\",\n          \"type\": \"IF\",\n        },\n        Object {\n          \"code\": \"true\",\n          \"raw\": \"IF true\",\n          \"type\": \"IF\",\n        },\n        Object {\n          \"code\": \"\",\n          \"raw\": \"END-IF\",\n          \"type\": \"END-IF\",\n        },\n        Object {\n          \"code\": \"\",\n          \"raw\": \"END-IF\",\n          \"type\": \"END-IF\",\n        },\n        Object {\n          \"code\": \"4 > 3\",\n          \"raw\": \"IF 4 > 3\",\n          \"type\": \"IF\",\n        },\n        Object {\n          \"code\": \"false\",\n          \"raw\": \"IF false\",\n          \"type\": \"IF\",\n        },\n        Object {\n          \"code\": \"\",\n          \"raw\": \"END-IF\",\n          \"type\": \"END-IF\",\n        },\n        Object {\n          \"code\": \"\",\n          \"raw\": \"END-IF\",\n          \"type\": \"END-IF\",\n        },\n        Object {\n          \"code\": \"4 < 3\",\n          \"raw\": \"IF 4 < 3\",\n          \"type\": \"IF\",\n        },\n        Object {\n          \"code\": \"true\",\n          \"raw\": \"IF true\",\n          \"type\": \"IF\",\n        },\n        Object {\n          \"code\": \"\",\n          \"raw\": \"END-IF\",\n          \"type\": \"END-IF\",\n        },\n        Object {\n          \"code\": \"\",\n          \"raw\": \"END-IF\",\n          \"type\": \"END-IF\",\n        },\n      ]\n    ");
                    return [2 /*return*/];
            }
        });
    }); });
    it('handles custom delimiter', function () { return __awaiter(void 0, void 0, void 0, function () {
        var template, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'for1customDelimiter.docx'))];
                case 1:
                    template = _b.sent();
                    _a = expect;
                    return [4 /*yield*/, main_1.listCommands(template, '***')];
                case 2:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n      Array [\n        Object {\n          \"code\": \"company IN companies\",\n          \"raw\": \"FOR company IN companies\",\n          \"type\": \"FOR\",\n        },\n        Object {\n          \"code\": \"$company.name\",\n          \"raw\": \"INS $company.name\",\n          \"type\": \"INS\",\n        },\n        Object {\n          \"code\": \"company\",\n          \"raw\": \"END-FOR company\",\n          \"type\": \"END-FOR\",\n        },\n      ]\n    ");
                    return [2 /*return*/];
            }
        });
    }); });
});
