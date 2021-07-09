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
var index_1 = require("../index");
var debug_1 = require("../debug");
if (process.env.DEBUG)
    debug_1.setDebugLogSink(console.log);
it('001: Issue #61 Correctly renders an SVG image', function () { return __awaiter(void 0, void 0, void 0, function () {
    var template, thumbnail, opts, result;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'imagesSVG.docx'))];
            case 1:
                template = _b.sent();
                _a = {};
                return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'sample.png'))];
            case 2:
                thumbnail = (_a.data = _b.sent(),
                    _a.extension = '.png',
                    _a);
                opts = {
                    template: template,
                    data: {},
                    additionalJsContext: {
                        svgImgFile: function () { return __awaiter(void 0, void 0, void 0, function () {
                            var data;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'sample.svg'))];
                                    case 1:
                                        data = _a.sent();
                                        return [2 /*return*/, {
                                                width: 6,
                                                height: 6,
                                                data: data,
                                                extension: '.svg',
                                                thumbnail: thumbnail,
                                            }];
                                }
                            });
                        }); },
                        svgImgStr: function () {
                            var data = Buffer.from("<svg  xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n                                  <rect x=\"10\" y=\"10\" height=\"100\" width=\"100\" style=\"stroke:#ff0000; fill: #0000ff\"/>\n                              </svg>", 'utf-8');
                            return {
                                width: 6,
                                height: 6,
                                data: data,
                                extension: '.svg',
                                thumbnail: thumbnail,
                            };
                        },
                    },
                };
                return [4 /*yield*/, index_1.createReport(opts, 'JS')];
            case 3:
                result = _b.sent();
                expect(result).toMatchSnapshot();
                return [2 /*return*/];
        }
    });
}); });
it('002: throws when thumbnail is incorrectly provided when inserting an SVG', function () { return __awaiter(void 0, void 0, void 0, function () {
    var template, thumbnail, opts;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'imagesSVG.docx'))];
            case 1:
                template = _b.sent();
                _a = {};
                return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'sample.png'))];
            case 2:
                thumbnail = (_a.data = _b.sent(),
                    _a);
                opts = {
                    template: template,
                    data: {},
                    additionalJsContext: {
                        svgImgFile: function () { return __awaiter(void 0, void 0, void 0, function () {
                            var data;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'sample.svg'))];
                                    case 1:
                                        data = _a.sent();
                                        return [2 /*return*/, {
                                                width: 6,
                                                height: 6,
                                                data: data,
                                                extension: '.svg',
                                                thumbnail: thumbnail,
                                            }];
                                }
                            });
                        }); },
                        svgImgStr: function () {
                            var data = Buffer.from("<svg  xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n                                  <rect x=\"10\" y=\"10\" height=\"100\" width=\"100\" style=\"stroke:#ff0000; fill: #0000ff\"/>\n                              </svg>", 'utf-8');
                            return {
                                width: 6,
                                height: 6,
                                data: data,
                                extension: '.svg',
                                thumbnail: thumbnail,
                            };
                        },
                    },
                };
                return [2 /*return*/, expect(index_1.createReport(opts)).rejects.toMatchSnapshot()];
        }
    });
}); });
it('003: can inject an svg without a thumbnail', function () { return __awaiter(void 0, void 0, void 0, function () {
    var template, opts, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'imagesSVG.docx'))];
            case 1:
                template = _a.sent();
                opts = {
                    template: template,
                    data: {},
                    additionalJsContext: {
                        svgImgFile: function () { return __awaiter(void 0, void 0, void 0, function () {
                            var data;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'sample.svg'))];
                                    case 1:
                                        data = _a.sent();
                                        return [2 /*return*/, {
                                                width: 6,
                                                height: 6,
                                                data: data,
                                                extension: '.svg',
                                            }];
                                }
                            });
                        }); },
                        svgImgStr: function () {
                            var data = Buffer.from("<svg  xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n                                  <rect x=\"10\" y=\"10\" height=\"100\" width=\"100\" style=\"stroke:#ff0000; fill: #0000ff\"/>\n                              </svg>", 'utf-8');
                            return {
                                width: 6,
                                height: 6,
                                data: data,
                                extension: '.svg',
                            };
                        },
                    },
                };
                return [4 /*yield*/, index_1.createReport(opts, 'JS')];
            case 2:
                result = _a.sent();
                expect(result).toMatchSnapshot();
                return [2 /*return*/];
        }
    });
}); });
it('004: can inject an image in the document header (regression test for #113)', function () { return __awaiter(void 0, void 0, void 0, function () {
    var template, opts;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'imageHeader.docx'))];
            case 1:
                template = _a.sent();
                opts = {
                    template: template,
                    data: {},
                    additionalJsContext: {
                        image: function () { return __awaiter(void 0, void 0, void 0, function () {
                            var data;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'sample.png'))];
                                    case 1:
                                        data = _a.sent();
                                        return [2 /*return*/, {
                                                width: 6,
                                                height: 6,
                                                data: data,
                                                extension: '.png',
                                            }];
                                }
                            });
                        }); },
                    },
                };
                // NOTE: bug does not happen when using debug probe arguments ('JS' or 'XML'),
                // as these exit before the headers are parsed.
                // TODO: build a snapshot test once _probe === 'XML' properly includes all document XMLs, not just
                // the main document
                return [2 /*return*/, expect(index_1.createReport(opts)).resolves.toBeInstanceOf(Uint8Array)];
        }
    });
}); });
it('005: can inject PNG files using ArrayBuffers without errors (related to issue #166)', function () { return __awaiter(void 0, void 0, void 0, function () {
    function toArrayBuffer(buf) {
        var ab = new ArrayBuffer(buf.length);
        var view = new Uint8Array(ab);
        for (var i = 0; i < buf.length; ++i) {
            view[i] = buf[i];
        }
        return ab;
    }
    var template, buff, fromAB, fromB;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'imageSimple.docx'))];
            case 1:
                template = _a.sent();
                return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'sample.png'))];
            case 2:
                buff = _a.sent();
                return [4 /*yield*/, index_1.createReport({
                        template: template,
                        data: {},
                        additionalJsContext: {
                            injectImg: function () {
                                return {
                                    width: 6,
                                    height: 6,
                                    data: toArrayBuffer(buff),
                                    extension: '.png',
                                };
                            },
                        },
                    })];
            case 3:
                fromAB = _a.sent();
                return [4 /*yield*/, index_1.createReport({
                        template: template,
                        data: {},
                        additionalJsContext: {
                            injectImg: function () {
                                return {
                                    width: 6,
                                    height: 6,
                                    data: buff,
                                    extension: '.png',
                                };
                            },
                        },
                    })];
            case 4:
                fromB = _a.sent();
                expect(fromAB).toBeInstanceOf(Uint8Array);
                expect(fromB).toBeInstanceOf(Uint8Array);
                expect(fromAB).toStrictEqual(fromB);
                return [2 /*return*/];
        }
    });
}); });
it('006: can inject an image from the data instead of the additionalJsContext', function () { return __awaiter(void 0, void 0, void 0, function () {
    var template, buff, reportA, reportB;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'imageSimple.docx'))];
            case 1:
                template = _a.sent();
                return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'sample.png'))];
            case 2:
                buff = _a.sent();
                return [4 /*yield*/, index_1.createReport({
                        template: template,
                        data: {
                            injectImg: function () { return ({
                                width: 6,
                                height: 6,
                                data: buff,
                                extension: '.png',
                            }); },
                        },
                    })];
            case 3:
                reportA = _a.sent();
                return [4 /*yield*/, index_1.createReport({
                        template: template,
                        data: {},
                        additionalJsContext: {
                            injectImg: function () { return ({
                                width: 6,
                                height: 6,
                                data: buff,
                                extension: '.png',
                            }); },
                        },
                    })];
            case 4:
                reportB = _a.sent();
                expect(reportA).toBeInstanceOf(Uint8Array);
                expect(reportB).toBeInstanceOf(Uint8Array);
                expect(reportA).toStrictEqual(reportB);
                return [2 /*return*/];
        }
    });
}); });
it('007: can inject an image in a document that already contains images (regression test for #144)', function () { return __awaiter(void 0, void 0, void 0, function () {
    var template, buff, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'imageExisting.docx'))];
            case 1:
                template = _b.sent();
                return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'sample.png'))];
            case 2:
                buff = _b.sent();
                _a = expect;
                return [4 /*yield*/, index_1.createReport({
                        template: template,
                        data: {
                            cv: { ProfilePicture: { url: 'abc' } },
                        },
                        additionalJsContext: {
                            getImage: function () { return ({
                                width: 6,
                                height: 6,
                                data: buff,
                                extension: '.png',
                            }); },
                        },
                    }, 'XML')];
            case 3:
                _a.apply(void 0, [_b.sent()]).toMatchSnapshot();
                return [2 /*return*/];
        }
    });
}); });
it('008: can inject an image in a shape in the doc footer (regression test for #217)', function () { return __awaiter(void 0, void 0, void 0, function () {
    var template, thumbnail_data, report;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'imageInShapeInFooter.docx'))];
            case 1:
                template = _a.sent();
                return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.join(__dirname, 'fixtures', 'sample.png'))];
            case 2:
                thumbnail_data = _a.sent();
                return [4 /*yield*/, index_1.createReport({
                        template: template,
                        data: {},
                        additionalJsContext: {
                            injectSvg: function () {
                                var svg_data = Buffer.from("<svg  xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n                                    <rect x=\"10\" y=\"10\" height=\"100\" width=\"100\" style=\"stroke:#ff0000; fill: #0000ff\"/>\n                                  </svg>", 'utf-8');
                                var thumbnail = {
                                    data: thumbnail_data,
                                    extension: '.png',
                                };
                                return {
                                    width: 6,
                                    height: 6,
                                    data: svg_data,
                                    extension: '.svg',
                                    thumbnail: thumbnail,
                                };
                            },
                        },
                    }, 'XML')];
            case 3:
                report = _a.sent();
                expect(report).toMatchSnapshot();
                return [2 /*return*/];
        }
    });
}); });
