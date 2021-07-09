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
var zip_1 = require("../zip");
var main_1 = require("../main");
var fs_1 = __importDefault(require("fs"));
var debug_1 = require("../debug");
var processTemplate_1 = require("../processTemplate");
if (process.env.DEBUG)
    debug_1.setDebugLogSink(console.log);
describe('[Content_Types].xml parser', function () {
    it('Correctly finds the main document xml file in a regular .docx file', function () { return __awaiter(void 0, void 0, void 0, function () {
        var template, zip, content_types, main_doc;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'simpleQuery.docx'))];
                case 1:
                    template = _a.sent();
                    return [4 /*yield*/, zip_1.zipLoad(template)];
                case 2:
                    zip = _a.sent();
                    return [4 /*yield*/, main_1.readContentTypes(zip)];
                case 3:
                    content_types = _a.sent();
                    main_doc = main_1.getMainDoc(content_types);
                    expect(main_doc).toStrictEqual('document.xml');
                    return [2 /*return*/];
            }
        });
    }); });
    it('Correctly finds the main document xml file in an Office365 .docx file', function () { return __awaiter(void 0, void 0, void 0, function () {
        var template, zip, content_types, main_doc;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'office365.docx'))];
                case 1:
                    template = _a.sent();
                    return [4 /*yield*/, zip_1.zipLoad(template)];
                case 2:
                    zip = _a.sent();
                    return [4 /*yield*/, main_1.readContentTypes(zip)];
                case 3:
                    content_types = _a.sent();
                    main_doc = main_1.getMainDoc(content_types);
                    expect(main_doc).toStrictEqual('document2.xml');
                    return [2 /*return*/];
            }
        });
    }); });
});
describe('getMetadata', function () {
    it('finds the number of pages', function () { return __awaiter(void 0, void 0, void 0, function () {
        var template, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'simpleQuery.docx'))];
                case 1:
                    template = _b.sent();
                    _a = expect;
                    return [4 /*yield*/, main_1.getMetadata(template)];
                case 2:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n      Object {\n        \"category\": undefined,\n        \"characters\": 24,\n        \"company\": undefined,\n        \"created\": \"2015-08-16T18:55:00Z\",\n        \"creator\": \"Unga Graorg\",\n        \"description\": undefined,\n        \"lastModifiedBy\": \"Grau Panea, Guillermo\",\n        \"lastPrinted\": undefined,\n        \"lines\": 1,\n        \"modified\": \"2016-12-15T11:21:00Z\",\n        \"pages\": 1,\n        \"paragraphs\": 1,\n        \"revision\": \"32\",\n        \"subject\": undefined,\n        \"template\": \"Normal.dotm\",\n        \"title\": undefined,\n        \"words\": 4,\n      }\n    ");
                    return [2 /*return*/];
            }
        });
    }); });
    it('smoke test: does not crash on normal docx files', function () { return __awaiter(void 0, void 0, void 0, function () {
        var files, _i, files_1, f, t, metadata;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    expect.hasAssertions();
                    return [4 /*yield*/, fs_1.default.promises.readdir(path_1.default.join(__dirname, 'fixtures'), 'utf-8')];
                case 1:
                    files = _a.sent();
                    _i = 0, files_1 = files;
                    _a.label = 2;
                case 2:
                    if (!(_i < files_1.length)) return [3 /*break*/, 6];
                    f = files_1[_i];
                    if (!f.endsWith('.docx'))
                        return [3 /*break*/, 5];
                    return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', f))];
                case 3:
                    t = _a.sent();
                    return [4 /*yield*/, main_1.getMetadata(t)];
                case 4:
                    metadata = _a.sent();
                    expect(typeof metadata.modified).toBe('string');
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 2];
                case 6: return [2 /*return*/];
            }
        });
    }); });
});
describe('findHighestImgId', function () {
    it('returns 0 when doc contains no images', function () { return __awaiter(void 0, void 0, void 0, function () {
        var template, jsTemplate;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'imageExistingMultiple.docx'))];
                case 1:
                    template = _a.sent();
                    return [4 /*yield*/, main_1.parseTemplate(template)];
                case 2:
                    jsTemplate = (_a.sent()).jsTemplate;
                    expect(processTemplate_1.findHighestImgId(jsTemplate)).toBe(3);
                    return [2 /*return*/];
            }
        });
    }); });
});
