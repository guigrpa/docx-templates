"use strict";
/* eslint-env jest */
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
var mockdate_1 = __importDefault(require("mockdate"));
var qrcode_1 = __importDefault(require("qrcode"));
var index_1 = require("../index");
var debug_1 = require("../debug");
if (process.env.DEBUG)
    debug_1.setDebugLogSink(console.log);
var LONG_TEXT = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed commodo sagittis erat, sed vehicula lorem molestie et. Sed eget nisi orci. Fusce ut scelerisque neque. Donec porta eleifend dolor. Morbi in egestas augue. Nunc non velit at nisl faucibus ultrices. Aenean ac lacinia tortor. Nunc elementum enim ut viverra maximus. Pellentesque et metus posuere, feugiat nulla in, feugiat mauris. Suspendisse eu urna aliquam, molestie ante at, convallis justo.\nNullam hendrerit quam sit amet nunc tincidunt dictum. Praesent hendrerit at quam ac fermentum. Donec rutrum enim lacus, mollis imperdiet ex posuere ac. Sed vel ullamcorper massa. Duis non posuere mauris. Etiam purus turpis, fermentum a rhoncus et, rutrum in nisl. Aliquam pharetra sit amet lectus sed bibendum. Sed sem ipsum, placerat a nisl vitae, pharetra mattis libero. Nunc finibus purus id consectetur sagittis. Pellentesque ornare egestas lacus, in blandit diam facilisis eget. Morbi nec ligula id ligula tincidunt tincidunt vulputate id erat. Quisque ut eros et sem pharetra placerat a vel leo. Praesent accumsan neque imperdiet, facilisis ipsum interdum, aliquam mi. Sed posuere purus eu sagittis aliquam.\n\nMorbi dignissim consequat ex, non finibus est faucibus sodales. Integer sed justo mollis, fringilla ipsum tempor, laoreet elit. Nullam iaculis finibus nulla a commodo. Curabitur nec suscipit velit, vitae lobortis mauris. Integer ac bibendum quam, eget pretium justo. Ut finibus, sem sed pharetra dictum, metus mauris tristique justo, sed congue erat mi a leo. Aliquam dui arcu, gravida quis magna ac, volutpat blandit felis. Morbi quis lobortis tortor. Cras pulvinar feugiat metus nec commodo. Sed sollicitudin risus vel risus finibus, sit amet pretium sapien fermentum. Nulla accumsan ullamcorper felis, quis tempor dolor. Praesent blandit ullamcorper pretium. Ut viverra molestie dui.";
['noSandbox', 'sandbox'].forEach(function (sbStatus) {
    var noSandbox = sbStatus === 'sandbox' ? false : true;
    describe("" + sbStatus, function () {
        describe('Template processing', function () {
            beforeEach(function () {
                // Set a global fixed Date. Some tests check the zip contents,
                // and the zip contains the date
                mockdate_1.default.set('1/1/2000');
            });
            afterEach(function () {
                mockdate_1.default.reset();
            });
            it('01 Probe works', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'noQuery.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                }, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result._children.length).toBeTruthy();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('02 Extracts a query and calls the resolver', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, queryResolver, queryVars;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'simpleQuery.docx'))];
                        case 1:
                            template = _a.sent();
                            queryResolver = jest.fn();
                            queryVars = { a: 'importantContext' };
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: queryResolver,
                                    queryVars: queryVars,
                                }, 'JS')];
                        case 2:
                            _a.sent();
                            expect(queryResolver.mock.calls.length).toEqual(1);
                            expect(queryResolver.mock.calls[0][0]).toEqual('exampleQuery');
                            expect(queryResolver.mock.calls[0][1]).toEqual(queryVars);
                            return [2 /*return*/];
                    }
                });
            }); });
            it("03 Uses the resolver's response to produce the report", function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'simpleQuerySimpleInserts.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: function () { return ({ a: 'foo', b: 'bar' }); },
                                }, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('04 Allows replacing the resolver by a data object', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'noQuerySimpleInserts.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: { a: 'foo', b: 'bar' },
                                }, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('04b Allows custom left-right delimiters', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'noQueryBrackets.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: { a: 'foo', b: 'bar' },
                                    cmdDelimiter: ['{', '}'],
                                }, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('05 Processes 1-level FOR loops', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'for1.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: {
                                        companies: [
                                            { name: 'FIRST' },
                                            { name: 'SECOND' },
                                            { name: 'THIRD' },
                                        ],
                                    },
                                }, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('06 Processes 2-level FOR loops', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'for2.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: {
                                        companies: [
                                            {
                                                name: 'FIRST',
                                                people: [{ firstName: 'Pep' }, { firstName: 'Fidel' }],
                                            },
                                            {
                                                name: 'SECOND',
                                                people: [{ firstName: 'Albert' }, { firstName: 'Xavi' }],
                                            },
                                        ],
                                    },
                                }, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('07 Processes 3-level FOR loops', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'for3.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: {
                                        companies: [
                                            {
                                                name: 'FIRST',
                                                people: [
                                                    {
                                                        firstName: 'Pep',
                                                        projects: [{ name: 'one' }, { name: 'two' }],
                                                    },
                                                    { firstName: 'Fidel', projects: [{ name: 'three' }] },
                                                ],
                                            },
                                            {
                                                name: 'SECOND',
                                                people: [
                                                    { firstName: 'Albert', projects: [] },
                                                    { firstName: 'Xavi', projects: [] },
                                                ],
                                            },
                                            {
                                                name: 'THIRD',
                                                people: [],
                                            },
                                        ],
                                    },
                                }, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('08 Processes 1-level FOR-ROW loops', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'for-row1.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: {
                                        companies: [
                                            { name: 'FIRST' },
                                            { name: 'SECOND' },
                                            { name: 'THIRD' },
                                        ],
                                    },
                                }, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('08b Processes 1-level IF-ROW loops', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'if-row1.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                }, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('09 Allows scalar arrays in FOR loops', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'for1scalars.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: { companies: ['FIRST', 'SECOND', 'THIRD'] },
                                }, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('10 Processes JS snippets to get the array elements', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'for1js.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: {
                                        companies: [
                                            { name: 'abengoa' },
                                            { name: 'Endesa' },
                                            { name: 'IBERDROLA' },
                                            { name: 'Acerinox' },
                                        ],
                                    },
                                }, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('11 Processes inline FOR loops', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'for1inline.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: {
                                        companies: [
                                            { name: 'FIRST' },
                                            { name: 'SECOND' },
                                            { name: 'THIRD' },
                                        ],
                                    },
                                }, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('12 Processes a more complex inline FOR loop with spaces', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'for1inlineWithSpaces.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: {
                                        companies: [
                                            { name: 'FIRST' },
                                            { name: 'SECOND' },
                                            { name: 'THIRD' },
                                        ],
                                    },
                                }, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('13a Processes 1-level IF', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'if.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                }, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('13b Processes 2-level IF', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'if2.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                }, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('13j Processes inline IF', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'ifInline.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                }, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('20 Processes ALIAS commands', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'for1alias.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: {
                                        companies: [
                                            { name: 'FIRST' },
                                            { name: 'SECOND' },
                                            { name: 'THIRD' },
                                        ],
                                    },
                                }, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('22 Allows accented characters and such', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'for1.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: {
                                        companies: [{ name: '¿Por qué?' }, { name: 'Porque sí' }],
                                    },
                                }, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('23 Allows characters that conflict with XML', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'for1.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: {
                                        companies: [
                                            { name: '3 < 4 << 400' },
                                            { name: '5 > 2 >> -100' },
                                            { name: 'a & b && c' },
                                        ],
                                    },
                                }, 'XML')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('23b Allows insertion of literal XML', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'literalXml.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: { text: 'foo||<w:br/>||bar' },
                                }, 'XML')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('23c Allows insertion of literal XML with custom delimiter', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'literalXml.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: { text: 'foo____<w:br/>____bar' },
                                    literalXmlDelimiter: '____',
                                }, 'XML')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('24 Allows Word to split commands arbitrarily, incl. delimiters', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'splitDelimiters.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: { foo: 'bar' },
                                }, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('25 Adds line breaks by default', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'longText.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: { longText: LONG_TEXT },
                                }, 'XML')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('25b Allows disabling line break processing', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'longText.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: { longText: LONG_TEXT },
                                    processLineBreaks: false,
                                }, 'XML')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('30 Processes simple JS snippets in an INS', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'insJsSimple.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                }, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('31 Processes more complex JS snippets in an INS', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'insJsComplex.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: { companies: ['FIRST', 'SECOND', 'THIRD'] },
                                }, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('32 Provides access to loop indices (JS)', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'insJsWithLoops.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: {
                                        companies: [
                                            { name: 'FIRST' },
                                            { name: 'SECOND' },
                                            { name: 'THIRD' },
                                        ],
                                    },
                                }, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('33 Processes EXEC commands (JS)', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'exec.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: {},
                                }, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('33b Processes EXEC with shorthand (!)', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'execShorthand.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: {},
                                }, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('33c Processes EXEC when a promise is returned', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'execPromise.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: {},
                                }, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('34 Processes INS with shorthand (=)', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'insShorthand.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: {
                                        companies: [
                                            { name: 'FIRST' },
                                            { name: 'SECOND' },
                                            { name: 'THIRD' },
                                        ],
                                    },
                                }, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('34b Processes INS omitting the command name', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'insOmitted.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: {
                                        companies: [
                                            { name: 'FIRST' },
                                            { name: 'SECOND' },
                                            { name: 'THIRD' },
                                        ],
                                    },
                                }, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('35 Processes all snippets in the same sandbox', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'execAndIns.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: {
                                        companies: [
                                            { name: 'FIRST' },
                                            { name: 'SECOND' },
                                            { name: 'THIRD' },
                                        ],
                                    },
                                }, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('36 Processes all snippets without sandbox', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'execAndIns.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    template: template,
                                    noSandbox: true,
                                    data: {
                                        companies: [
                                            { name: 'FIRST' },
                                            { name: 'SECOND' },
                                            { name: 'THIRD' },
                                        ],
                                    },
                                }, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('36b Processes a snippet with additional context', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'execWithContext.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: {
                                        companies: [
                                            { name: 'FIRST' },
                                            { name: 'SECOND' },
                                            { name: 'THIRD' },
                                        ],
                                    },
                                    additionalJsContext: {
                                        toLowerCase: function (str) { return str.toLowerCase(); },
                                    },
                                }, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('38b Processes IMAGE commands with base64 data', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, options, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            mockdate_1.default.set('1/1/2000');
                            return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'imageBase64.docx'))];
                        case 1:
                            template = _a.sent();
                            options = {
                                noSandbox: noSandbox,
                                template: template,
                                data: {},
                                additionalJsContext: {
                                    qr: function (contents) { return __awaiter(void 0, void 0, void 0, function () {
                                        var dataUrl, data;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0: return [4 /*yield*/, qrcode_1.default.toDataURL(contents, { width: 500 })];
                                                case 1:
                                                    dataUrl = _a.sent();
                                                    data = dataUrl.slice('data:image/gif;base64,'.length);
                                                    return [2 /*return*/, { width: 6, height: 6, data: data, extension: '.gif' }];
                                            }
                                        });
                                    }); },
                                },
                            };
                            return [4 /*yield*/, index_1.createReport(options, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('38c Processes IMAGE commands with alt text', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, options, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            mockdate_1.default.set('1/1/2000');
                            return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'imageBase64.docx'))];
                        case 1:
                            template = _a.sent();
                            options = {
                                noSandbox: noSandbox,
                                template: template,
                                data: {},
                                additionalJsContext: {
                                    qr: function (contents) { return __awaiter(void 0, void 0, void 0, function () {
                                        var dataUrl, data;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0: return [4 /*yield*/, qrcode_1.default.toDataURL(contents, { width: 500 })];
                                                case 1:
                                                    dataUrl = _a.sent();
                                                    data = dataUrl.slice('data:image/gif;base64,'.length);
                                                    return [2 /*return*/, {
                                                            width: 6,
                                                            height: 6,
                                                            data: data,
                                                            extension: '.gif',
                                                            alt: "qr code for " + contents,
                                                        }];
                                            }
                                        });
                                    }); },
                                },
                            };
                            return [4 /*yield*/, index_1.createReport(options, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('39 Processes LINK commands', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'links.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: {},
                                }, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('3A Processes HTML commands', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'htmls.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: {},
                                }, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('40 Throws on invalid command', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'invalidCommand.docx'))];
                        case 1:
                            template = _a.sent();
                            return [2 /*return*/, expect(index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: {
                                        companies: [
                                            { name: 'FIRST' },
                                            { name: 'SECOND' },
                                            { name: 'THIRD' },
                                        ],
                                    },
                                }, 'JS')).rejects.toMatchSnapshot()];
                    }
                });
            }); });
            it('41 Throws on invalid for logic', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'invalidFor.docx'))];
                        case 1:
                            template = _a.sent();
                            return [2 /*return*/, expect(index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: {
                                        companies: [
                                            { name: 'FIRST' },
                                            { name: 'SECOND' },
                                            { name: 'THIRD' },
                                        ],
                                        persons: [{ name: 'johnny' }],
                                    },
                                }, 'JS')).rejects.toMatchSnapshot()];
                    }
                });
            }); });
            it('41b Throws on invalid if logic (bad nesting)', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'invalidIf.docx'))];
                        case 1:
                            template = _a.sent();
                            return [2 /*return*/, expect(index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: {
                                        companies: [
                                            { name: 'FIRST' },
                                            { name: 'SECOND' },
                                            { name: 'THIRD' },
                                        ],
                                    },
                                }, 'JS')).rejects.toMatchSnapshot()];
                    }
                });
            }); });
            it('70 Allows customisation of cmd delimiter', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'for1customDelimiter.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: {
                                        companies: [
                                            { name: 'FIRST' },
                                            { name: 'SECOND' },
                                            { name: 'THIRD' },
                                        ],
                                    },
                                    cmdDelimiter: '***',
                                }, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('80 Copes with a more complex example: WBS', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'wbs.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: {
                                        project: {
                                            name: 'docx-templates',
                                            workPackages: [
                                                {
                                                    acronym: 'WP1',
                                                    title: 'Work Package 1',
                                                    startMilestone: { acronym: 'M1', plannedDelta: '0 m' },
                                                    endMilestone: { acronym: 'M2', plannedDelta: '2 m' },
                                                    leaderCompany: { acronym: 'me' },
                                                },
                                                {
                                                    acronym: 'WP2',
                                                    title: 'Work Package 2',
                                                    startMilestone: { acronym: 'M2', plannedDelta: '2 m' },
                                                    endMilestone: { acronym: 'M3', plannedDelta: '4 m' },
                                                    leaderCompany: {},
                                                },
                                            ],
                                        },
                                    },
                                }, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('83 LINK inside FOR loop: regression test for issue #83', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, opts, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'link-regression-issue-83.docx'))];
                        case 1:
                            template = _b.sent();
                            opts = {
                                noSandbox: noSandbox,
                                template: template,
                                data: {
                                    companies: [
                                        {
                                            name: 'FIRST',
                                        },
                                        {
                                            name: 'SECOND',
                                        },
                                    ],
                                },
                            };
                            // Render to an object and compare with snapshot.
                            _a = expect;
                            return [4 /*yield*/, index_1.createReport(opts, 'JS')];
                        case 2:
                            // Render to an object and compare with snapshot.
                            _a.apply(void 0, [_b.sent()]).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('112a failFast: false lists all errors in the document before failing.', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'invalidMultipleErrors.docx'))];
                        case 1:
                            template = _a.sent();
                            return [2 /*return*/, expect(index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: {
                                        companies: [
                                            { name: 'FIRST' },
                                            { name: 'SECOND' },
                                            { name: 'THIRD' },
                                        ],
                                    },
                                    failFast: false,
                                }, 'JS')).rejects.toMatchSnapshot()];
                    }
                });
            }); });
            it('112b failFast: true has the same behaviour as when failFast is undefined', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'invalidMultipleErrors.docx'))];
                        case 1:
                            template = _a.sent();
                            return [2 /*return*/, expect(index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: {
                                        companies: [
                                            { name: 'FIRST' },
                                            { name: 'SECOND' },
                                            { name: 'THIRD' },
                                        ],
                                    },
                                    failFast: true,
                                }, 'JS')).rejects.toMatchSnapshot()];
                    }
                });
            }); });
            it('avoids confusion between variable name and built-in command', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, opts, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'confusingCommandNames.docx'))];
                        case 1:
                            template = _b.sent();
                            opts = {
                                noSandbox: noSandbox,
                                template: template,
                                data: {
                                    something: 'should show up 1',
                                    INSertable: 'should show up 2',
                                    companies: [
                                        { name: 'FIRST' },
                                        { name: 'SECOND' },
                                        { name: 'THIRD' },
                                    ],
                                },
                                additionalJsContext: { formatNumber: function (n) { return n.toFixed(); } },
                            };
                            // Render to an object and compare with snapshot.
                            _a = expect;
                            return [4 /*yield*/, index_1.createReport(opts, 'JS')];
                        case 2:
                            // Render to an object and compare with snapshot.
                            _a.apply(void 0, [_b.sent()]).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('107a non-alphanumeric INS commands (e.g. Chinese)', function () { return __awaiter(void 0, void 0, void 0, function () {
                var data, _a, _b;
                var _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            data = {
                                姓名: 'hong',
                                标题: 'junyao',
                            };
                            _a = expect;
                            _b = index_1.createReport;
                            _c = {
                                noSandbox: noSandbox
                            };
                            return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'nonAlphaCommandNames1.docx'))];
                        case 1: return [4 /*yield*/, _b.apply(void 0, [(_c.template = _d.sent(),
                                    _c.data = data,
                                    _c), 'JS'])];
                        case 2:
                            _a.apply(void 0, [_d.sent()]).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('107b non-alphanumeric INS commands (e.g. Chinese) with custom delimiter', function () { return __awaiter(void 0, void 0, void 0, function () {
                var data, _a, _b;
                var _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            data = {
                                姓名: 'hong',
                                标题: 'junyao',
                            };
                            _a = expect;
                            _b = index_1.createReport;
                            _c = {
                                noSandbox: noSandbox
                            };
                            return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'nonAlphaCommandNames2.docx'))];
                        case 1: return [4 /*yield*/, _b.apply(void 0, [(_c.template = _d.sent(),
                                    _c.data = data,
                                    _c.cmdDelimiter = ['{', '}'],
                                    _c), 'JS'])];
                        case 2:
                            _a.apply(void 0, [_d.sent()]).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('131 correctly handles Office 365 .docx files', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'office365.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: {
                                        test: 'first value!',
                                        test2: 'second value!',
                                    },
                                    failFast: true,
                                    cmdDelimiter: ['{', '}'],
                                }, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('iterate over object properties and keys in FOR loop', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'forOverObjectKeys.docx'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: {
                                        companies: {
                                            one: 'FIRST',
                                            two: 'SECOND',
                                            three: 'THIRD',
                                        },
                                    },
                                }, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('fixSmartQuotes flag (see PR #152)', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'fixSmartQuotes.docx'))];
                        case 1:
                            template = _a.sent();
                            // The default behaviour should return an error when smart quotes (curly quotes) are present in the command,
                            // as the command isn't valid javascript.
                            return [4 /*yield*/, expect(index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: {},
                                })).rejects.toThrowError("Error executing command 'reverse(‘aubergine’)'. SyntaxError: Invalid or unexpected token")];
                        case 2:
                            // The default behaviour should return an error when smart quotes (curly quotes) are present in the command,
                            // as the command isn't valid javascript.
                            _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: {},
                                    fixSmartQuotes: true,
                                }, 'XML')];
                        case 3:
                            result = _a.sent();
                            expect(result.includes('enigrebua')).toBeTruthy(); // the word aubergine in reverse
                            return [2 /*return*/];
                    }
                });
            }); });
            it('works with macro-enabled (docm) templates', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'macroEnabledTemplate.docm'))];
                        case 1:
                            template = _a.sent();
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: {},
                                }, 'JS')];
                        case 2:
                            result = _a.sent();
                            expect(result).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('INS command is an array (see issue #214)', function () { return __awaiter(void 0, void 0, void 0, function () {
                var template, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'insertArray.docx'))];
                        case 1:
                            template = _b.sent();
                            _a = expect;
                            return [4 /*yield*/, index_1.createReport({
                                    noSandbox: noSandbox,
                                    template: template,
                                    data: {
                                        companies: ['a', 'b', 'c'],
                                    },
                                }, 'JS')];
                        case 2:
                            _a.apply(void 0, [_b.sent()]).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
        });
    });
});
