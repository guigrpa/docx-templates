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
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMainDoc = exports.readContentTypes = exports.getMetadata = exports.listCommands = exports.parseTemplate = void 0;
var timm_1 = require("timm");
var zip_1 = require("./zip");
var xml_1 = require("./xml");
var preprocessTemplate_1 = __importDefault(require("./preprocessTemplate"));
var processTemplate_1 = require("./processTemplate");
var reportUtils_1 = require("./reportUtils");
var errors_1 = require("./errors");
var debug_1 = require("./debug");
var DEFAULT_CMD_DELIMITER = '+++';
var DEFAULT_LITERAL_XML_DELIMITER = '||';
var CONTENT_TYPES_PATH = '[Content_Types].xml';
var TEMPLATE_PATH = 'word';
var XML_FILE_REGEX = new RegExp(TEMPLATE_PATH + "\\/[^\\/]+\\.xml");
function parseTemplate(template) {
    return __awaiter(this, void 0, void 0, function () {
        var zip, contentTypes, mainDocument, templateXml, tic, parseResult, jsTemplate, tac;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    debug_1.logger.debug('Unzipping...');
                    return [4 /*yield*/, zip_1.zipLoad(template)];
                case 1:
                    zip = _a.sent();
                    // Read the 'document.xml' file (the template) and parse it
                    debug_1.logger.debug('finding main template file (e.g. document.xml)');
                    return [4 /*yield*/, readContentTypes(zip)];
                case 2:
                    contentTypes = _a.sent();
                    mainDocument = getMainDoc(contentTypes);
                    debug_1.logger.debug('Reading template...');
                    return [4 /*yield*/, zip_1.zipGetText(zip, TEMPLATE_PATH + "/" + mainDocument)];
                case 3:
                    templateXml = _a.sent();
                    if (templateXml == null)
                        throw new errors_1.TemplateParseError(mainDocument + " could not be found");
                    debug_1.logger.debug("Template file length: " + templateXml.length);
                    debug_1.logger.debug('Parsing XML...');
                    tic = new Date().getTime();
                    return [4 /*yield*/, xml_1.parseXml(templateXml)];
                case 4:
                    parseResult = _a.sent();
                    jsTemplate = parseResult;
                    tac = new Date().getTime();
                    debug_1.logger.debug("File parsed in " + (tac - tic) + " ms", {
                        attach: jsTemplate,
                        attachLevel: 'trace',
                    });
                    return [2 /*return*/, { jsTemplate: jsTemplate, mainDocument: mainDocument, zip: zip, contentTypes: contentTypes }];
            }
        });
    });
}
exports.parseTemplate = parseTemplate;
function createReport(options, _probe) {
    return __awaiter(this, void 0, void 0, function () {
        var template, data, queryVars, literalXmlDelimiter, createOptions, xmlOptions, _a, jsTemplate, mainDocument, zip, contentTypes, prepped_template, queryResult, query, secondary_xml_files, prepped_secondaries, _i, secondary_xml_files_1, f, raw, js0, js, highest_img_id, ctx, result, report1, images1, links1, htmls1, reportXml, numImages, numHtmls, images, links, htmls, _b, prepped_secondaries_1, _c, js, filePath, result_1, report2, images2, links2, htmls2, xml, segments, documentComponent, ensureContentType, finalContentTypesXml, output;
        var _this = this;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    debug_1.logger.debug('Report options:', { attach: options });
                    template = options.template, data = options.data, queryVars = options.queryVars;
                    literalXmlDelimiter = options.literalXmlDelimiter || DEFAULT_LITERAL_XML_DELIMITER;
                    createOptions = {
                        cmdDelimiter: getCmdDelimiter(options.cmdDelimiter),
                        literalXmlDelimiter: literalXmlDelimiter,
                        processLineBreaks: options.processLineBreaks != null ? options.processLineBreaks : true,
                        noSandbox: options.noSandbox || false,
                        runJs: options.runJs,
                        additionalJsContext: options.additionalJsContext || {},
                        failFast: options.failFast == null ? true : options.failFast,
                        rejectNullish: options.rejectNullish == null ? false : options.rejectNullish,
                        errorHandler: typeof options.errorHandler === 'function' ? options.errorHandler : null,
                        fixSmartQuotes: options.fixSmartQuotes == null ? false : options.fixSmartQuotes,
                    };
                    xmlOptions = { literalXmlDelimiter: literalXmlDelimiter };
                    return [4 /*yield*/, parseTemplate(template)];
                case 1:
                    _a = _d.sent(), jsTemplate = _a.jsTemplate, mainDocument = _a.mainDocument, zip = _a.zip, contentTypes = _a.contentTypes;
                    debug_1.logger.debug('Preprocessing template...');
                    prepped_template = preprocessTemplate_1.default(jsTemplate, createOptions.cmdDelimiter);
                    queryResult = null;
                    if (!(typeof data === 'function')) return [3 /*break*/, 4];
                    debug_1.logger.debug('Looking for the query in the template...');
                    return [4 /*yield*/, processTemplate_1.extractQuery(prepped_template, createOptions)];
                case 2:
                    query = _d.sent();
                    debug_1.logger.debug("Query: " + (query || 'no query found'));
                    return [4 /*yield*/, data(query, queryVars)];
                case 3:
                    queryResult = _d.sent();
                    return [3 /*break*/, 5];
                case 4:
                    queryResult = data;
                    _d.label = 5;
                case 5:
                    secondary_xml_files = [];
                    zip.forEach(function (filePath) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            if (XML_FILE_REGEX.test(filePath) &&
                                filePath !== TEMPLATE_PATH + "/" + mainDocument &&
                                filePath.indexOf(TEMPLATE_PATH + "/template") !== 0) {
                                secondary_xml_files.push(filePath);
                            }
                            return [2 /*return*/];
                        });
                    }); });
                    prepped_secondaries = [];
                    _i = 0, secondary_xml_files_1 = secondary_xml_files;
                    _d.label = 6;
                case 6:
                    if (!(_i < secondary_xml_files_1.length)) return [3 /*break*/, 10];
                    f = secondary_xml_files_1[_i];
                    return [4 /*yield*/, zip_1.zipGetText(zip, f)];
                case 7:
                    raw = _d.sent();
                    if (raw == null)
                        throw new errors_1.TemplateParseError(f + " could not be read");
                    return [4 /*yield*/, xml_1.parseXml(raw)];
                case 8:
                    js0 = _d.sent();
                    js = preprocessTemplate_1.default(js0, createOptions.cmdDelimiter);
                    prepped_secondaries.push([js, f]);
                    _d.label = 9;
                case 9:
                    _i++;
                    return [3 /*break*/, 6];
                case 10:
                    highest_img_id = Math.max.apply(Math, __spreadArray(__spreadArray([], prepped_secondaries.map(function (_a) {
                        var s = _a[0], _ = _a[1];
                        return processTemplate_1.findHighestImgId(s);
                    })), [processTemplate_1.findHighestImgId(prepped_template)]));
                    // Process document.xml:
                    // - Generate the report
                    // - Build output XML and write it to disk
                    // - Images
                    debug_1.logger.debug('Generating report...');
                    ctx = processTemplate_1.newContext(createOptions, highest_img_id);
                    return [4 /*yield*/, processTemplate_1.produceJsReport(queryResult, prepped_template, ctx)];
                case 11:
                    result = _d.sent();
                    if (result.status === 'errors') {
                        throw result.errors;
                    }
                    report1 = result.report, images1 = result.images, links1 = result.links, htmls1 = result.htmls;
                    if (_probe === 'JS')
                        return [2 /*return*/, report1];
                    debug_1.logger.debug('Converting report to XML...');
                    reportXml = xml_1.buildXml(report1, xmlOptions);
                    if (_probe === 'XML')
                        return [2 /*return*/, reportXml];
                    debug_1.logger.debug('Writing report...');
                    zip_1.zipSetText(zip, TEMPLATE_PATH + "/" + mainDocument, reportXml);
                    numImages = Object.keys(images1).length;
                    numHtmls = Object.keys(htmls1).length;
                    return [4 /*yield*/, processImages(images1, mainDocument, zip, TEMPLATE_PATH)];
                case 12:
                    _d.sent();
                    return [4 /*yield*/, processLinks(links1, mainDocument, zip, TEMPLATE_PATH)];
                case 13:
                    _d.sent();
                    return [4 /*yield*/, processHtmls(htmls1, mainDocument, zip, TEMPLATE_PATH)];
                case 14:
                    _d.sent();
                    images = images1;
                    links = links1;
                    htmls = htmls1;
                    _b = 0, prepped_secondaries_1 = prepped_secondaries;
                    _d.label = 15;
                case 15:
                    if (!(_b < prepped_secondaries_1.length)) return [3 /*break*/, 21];
                    _c = prepped_secondaries_1[_b], js = _c[0], filePath = _c[1];
                    return [4 /*yield*/, processTemplate_1.produceJsReport(queryResult, js, ctx)];
                case 16:
                    result_1 = _d.sent();
                    if (result_1.status === 'errors') {
                        throw result_1.errors;
                    }
                    report2 = result_1.report, images2 = result_1.images, links2 = result_1.links, htmls2 = result_1.htmls;
                    images = timm_1.merge(images, images2);
                    links = timm_1.merge(links, links2);
                    htmls = timm_1.merge(htmls, htmls2);
                    xml = xml_1.buildXml(report2, xmlOptions);
                    zip_1.zipSetText(zip, filePath, xml);
                    numImages += Object.keys(images2).length;
                    numHtmls += Object.keys(htmls2).length;
                    segments = filePath.split('/');
                    documentComponent = segments[segments.length - 1];
                    return [4 /*yield*/, processImages(images2, documentComponent, zip, TEMPLATE_PATH)];
                case 17:
                    _d.sent();
                    return [4 /*yield*/, processLinks(links2, mainDocument, zip, TEMPLATE_PATH)];
                case 18:
                    _d.sent();
                    return [4 /*yield*/, processHtmls(htmls2, mainDocument, zip, TEMPLATE_PATH)];
                case 19:
                    _d.sent();
                    _d.label = 20;
                case 20:
                    _b++;
                    return [3 /*break*/, 15];
                case 21:
                    // Process [Content_Types].xml
                    if (numImages || numHtmls) {
                        debug_1.logger.debug('Completing [Content_Types].xml...');
                        ensureContentType = function (extension, contentType) {
                            var children = contentTypes._children;
                            if (children.filter(function (o) { return !o._fTextNode && o._attrs.Extension === extension; })
                                .length) {
                                return;
                            }
                            reportUtils_1.addChild(contentTypes, reportUtils_1.newNonTextNode('Default', {
                                Extension: extension,
                                ContentType: contentType,
                            }));
                        };
                        if (numImages) {
                            debug_1.logger.debug('Completing [Content_Types].xml for IMAGES...');
                            ensureContentType('png', 'image/png');
                            ensureContentType('jpg', 'image/jpeg');
                            ensureContentType('jpeg', 'image/jpeg');
                            ensureContentType('gif', 'image/gif');
                            ensureContentType('bmp', 'image/bmp');
                            ensureContentType('svg', 'image/svg+xml');
                        }
                        if (numHtmls) {
                            debug_1.logger.debug('Completing [Content_Types].xml for HTML...');
                            ensureContentType('html', 'text/html');
                        }
                        finalContentTypesXml = xml_1.buildXml(contentTypes, xmlOptions);
                        zip_1.zipSetText(zip, CONTENT_TYPES_PATH, finalContentTypesXml);
                    }
                    debug_1.logger.debug('Zipping...');
                    return [4 /*yield*/, zip_1.zipSave(zip)];
                case 22:
                    output = _d.sent();
                    return [2 /*return*/, output];
            }
        });
    });
}
/**
 * Lists all the commands in a docx template.
 *
 * example:
 * ```js
 * const template_buffer = fs.readFileSync('template.docx');
 * const commands = await listCommands(template_buffer, ['{', '}']);
 * // `commands` will contain something like:
 * [
 *    { raw: 'INS some_variable', code: 'some_variable', type: 'INS' },
 *    { raw: 'IMAGE svgImgFile()', code: 'svgImgFile()', type: 'IMAGE' },
 * ]
 * ```
 *
 * @param template the docx template as a Buffer-like object
 * @param delimiter the command delimiter (defaults to ['+++', '+++'])
 */
function listCommands(template, delimiter) {
    return __awaiter(this, void 0, void 0, function () {
        var opts, jsTemplate, prepped, commands, ctx;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    opts = {
                        cmdDelimiter: getCmdDelimiter(delimiter),
                        // Otherwise unused but mandatory options
                        literalXmlDelimiter: DEFAULT_LITERAL_XML_DELIMITER,
                        processLineBreaks: true,
                        noSandbox: false,
                        additionalJsContext: {},
                        failFast: false,
                        rejectNullish: false,
                        errorHandler: null,
                        fixSmartQuotes: false,
                    };
                    return [4 /*yield*/, parseTemplate(template)];
                case 1:
                    jsTemplate = (_a.sent()).jsTemplate;
                    debug_1.logger.debug('Preprocessing template...');
                    prepped = preprocessTemplate_1.default(jsTemplate, opts.cmdDelimiter);
                    commands = [];
                    ctx = processTemplate_1.newContext(opts);
                    return [4 /*yield*/, processTemplate_1.walkTemplate(undefined, prepped, ctx, function (data, node, ctx) { return __awaiter(_this, void 0, void 0, function () {
                            var raw, _a, cmdName, code, type;
                            return __generator(this, function (_b) {
                                raw = processTemplate_1.getCommand(ctx.cmd, ctx.shorthands, ctx.options.fixSmartQuotes);
                                ctx.cmd = ''; // flush the context
                                _a = processTemplate_1.splitCommand(raw), cmdName = _a.cmdName, code = _a.cmdRest;
                                type = cmdName;
                                if (type != null && type !== 'CMD_NODE') {
                                    commands.push({
                                        raw: raw,
                                        type: type,
                                        code: code,
                                    });
                                }
                                return [2 /*return*/, undefined];
                            });
                        }); })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, commands];
            }
        });
    });
}
exports.listCommands = listCommands;
/**
 * Extract metadata from a document, such as the number of pages or words.
 * @param template the docx template as a Buffer-like object
 */
function getMetadata(template) {
    return __awaiter(this, void 0, void 0, function () {
        // TODO: extract custom.xml as well?
        function getText(t) {
            if (t._children.length === 0)
                return undefined;
            var n = t._children[0];
            if (n._fTextNode)
                return n._text;
            throw new Error("Not a text node");
        }
        function findNodeText(m, tag) {
            for (var _i = 0, _a = m._children; _i < _a.length; _i++) {
                var t = _a[_i];
                if (t._fTextNode)
                    continue;
                if (t._tag === tag)
                    return getText(t);
            }
            return;
        }
        var app_xml_path, core_xml_path, zip, appXml, coreXml, numberize;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    app_xml_path = "docProps/app.xml";
                    core_xml_path = "docProps/core.xml";
                    return [4 /*yield*/, zip_1.zipLoad(template)];
                case 1:
                    zip = _a.sent();
                    return [4 /*yield*/, parsePath(zip, app_xml_path)];
                case 2:
                    appXml = _a.sent();
                    return [4 /*yield*/, parsePath(zip, core_xml_path)];
                case 3:
                    coreXml = _a.sent();
                    numberize = function (a) {
                        var c = Number(a);
                        if (Number.isFinite(c))
                            return c;
                        return;
                    };
                    return [2 /*return*/, {
                            pages: numberize(findNodeText(appXml, 'Pages')),
                            words: numberize(findNodeText(appXml, 'Words')),
                            characters: numberize(findNodeText(appXml, 'Characters')),
                            lines: numberize(findNodeText(appXml, 'Lines')),
                            paragraphs: numberize(findNodeText(appXml, 'Paragraphs')),
                            company: findNodeText(appXml, 'Company'),
                            template: findNodeText(appXml, 'Template'),
                            // from CoreXML
                            title: findNodeText(coreXml, 'dc:title'),
                            subject: findNodeText(coreXml, 'dc:subject'),
                            creator: findNodeText(coreXml, 'dc:creator'),
                            description: findNodeText(coreXml, 'dc:description'),
                            lastModifiedBy: findNodeText(coreXml, 'cp:lastModifiedBy'),
                            revision: findNodeText(coreXml, 'cp:revision'),
                            lastPrinted: findNodeText(coreXml, 'cp:lastPrinted'),
                            created: findNodeText(coreXml, 'dcterms:created'),
                            modified: findNodeText(coreXml, 'dcterms:modified'),
                            category: findNodeText(coreXml, 'cp:category'),
                        }];
            }
        });
    });
}
exports.getMetadata = getMetadata;
function parsePath(zip, xml_path) {
    return __awaiter(this, void 0, void 0, function () {
        var xmlFile, node;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, zip_1.zipGetText(zip, xml_path)];
                case 1:
                    xmlFile = _a.sent();
                    if (xmlFile == null)
                        throw new errors_1.TemplateParseError(xml_path + " could not be read");
                    return [4 /*yield*/, xml_1.parseXml(xmlFile)];
                case 2:
                    node = _a.sent();
                    if (node._fTextNode)
                        throw new errors_1.TemplateParseError(xml_path + " is a text node when parsed");
                    return [2 /*return*/, node];
            }
        });
    });
}
function readContentTypes(zip) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, parsePath(zip, CONTENT_TYPES_PATH)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
exports.readContentTypes = readContentTypes;
function getMainDoc(contentTypes) {
    var MAIN_DOC_MIMES = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml',
        'application/vnd.ms-word.document.macroEnabled.main+xml',
    ];
    for (var _i = 0, _a = contentTypes._children; _i < _a.length; _i++) {
        var t = _a[_i];
        if (!t._fTextNode) {
            if (t._attrs.ContentType != null &&
                MAIN_DOC_MIMES.includes(t._attrs.ContentType)) {
                var path = t._attrs.PartName;
                if (path) {
                    return path.replace('/word/', '');
                }
            }
        }
    }
    throw new errors_1.TemplateParseError("Could not find main document (e.g. document.xml) in " + CONTENT_TYPES_PATH);
}
exports.getMainDoc = getMainDoc;
// ==========================================
// Process images
// ==========================================
var processImages = function (images, documentComponent, zip, templatePath) { return __awaiter(void 0, void 0, void 0, function () {
    var imageIds, relsPath, rels, i, imageId, _a, extension, imgData, imgName, imgPath, finalRelsXml;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                debug_1.logger.debug("Processing images for " + documentComponent + "...");
                imageIds = Object.keys(images);
                if (!imageIds.length) return [3 /*break*/, 2];
                debug_1.logger.debug('Completing document.xml.rels...');
                relsPath = templatePath + "/_rels/" + documentComponent + ".rels";
                return [4 /*yield*/, getRelsFromZip(zip, relsPath)];
            case 1:
                rels = _b.sent();
                for (i = 0; i < imageIds.length; i++) {
                    imageId = imageIds[i];
                    _a = images[imageId], extension = _a.extension, imgData = _a.data;
                    imgName = "template_" + documentComponent + "_image" + (i + 1) + extension;
                    debug_1.logger.debug("Writing image " + imageId + " (" + imgName + ")...");
                    imgPath = templatePath + "/media/" + imgName;
                    if (typeof imgData === 'string') {
                        zip_1.zipSetBase64(zip, imgPath, imgData);
                    }
                    else {
                        zip_1.zipSetBinary(zip, imgPath, imgData);
                    }
                    reportUtils_1.addChild(rels, reportUtils_1.newNonTextNode('Relationship', {
                        Id: imageId,
                        Type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
                        Target: "media/" + imgName,
                    }));
                }
                finalRelsXml = xml_1.buildXml(rels, {
                    literalXmlDelimiter: DEFAULT_LITERAL_XML_DELIMITER,
                });
                zip_1.zipSetText(zip, relsPath, finalRelsXml);
                _b.label = 2;
            case 2: return [2 /*return*/];
        }
    });
}); };
// ==========================================
// Process links
// ==========================================
var processLinks = function (links, documentComponent, zip, templatePath) { return __awaiter(void 0, void 0, void 0, function () {
    var linkIds, relsPath, rels, _i, linkIds_1, linkId, url, finalRelsXml;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                debug_1.logger.debug("Processing links for " + documentComponent + "...");
                linkIds = Object.keys(links);
                if (!linkIds.length) return [3 /*break*/, 2];
                debug_1.logger.debug('Completing document.xml.rels...');
                relsPath = templatePath + "/_rels/" + documentComponent + ".rels";
                return [4 /*yield*/, getRelsFromZip(zip, relsPath)];
            case 1:
                rels = _a.sent();
                for (_i = 0, linkIds_1 = linkIds; _i < linkIds_1.length; _i++) {
                    linkId = linkIds_1[_i];
                    url = links[linkId].url;
                    reportUtils_1.addChild(rels, reportUtils_1.newNonTextNode('Relationship', {
                        Id: linkId,
                        Type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink',
                        Target: url,
                        TargetMode: 'External',
                    }));
                }
                finalRelsXml = xml_1.buildXml(rels, {
                    literalXmlDelimiter: DEFAULT_LITERAL_XML_DELIMITER,
                });
                zip_1.zipSetText(zip, relsPath, finalRelsXml);
                _a.label = 2;
            case 2: return [2 /*return*/];
        }
    });
}); };
var processHtmls = function (htmls, documentComponent, zip, templatePath) { return __awaiter(void 0, void 0, void 0, function () {
    var htmlIds, htmlFiles, relsPath, rels, _i, htmlIds_1, htmlId, htmlData, htmlName, htmlPath, finalRelsXml;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                debug_1.logger.debug("Processing htmls for " + documentComponent + "...");
                htmlIds = Object.keys(htmls);
                if (!htmlIds.length) return [3 /*break*/, 2];
                // Process rels
                debug_1.logger.debug("Completing document.xml.rels...");
                htmlFiles = [];
                relsPath = templatePath + "/_rels/" + documentComponent + ".rels";
                return [4 /*yield*/, getRelsFromZip(zip, relsPath)];
            case 1:
                rels = _a.sent();
                for (_i = 0, htmlIds_1 = htmlIds; _i < htmlIds_1.length; _i++) {
                    htmlId = htmlIds_1[_i];
                    htmlData = htmls[htmlId];
                    htmlName = "template_" + documentComponent + "_" + htmlId + ".html";
                    debug_1.logger.debug("Writing html " + htmlId + " (" + htmlName + ")...");
                    htmlPath = templatePath + "/" + htmlName;
                    htmlFiles.push("/" + htmlPath);
                    zip_1.zipSetText(zip, htmlPath, htmlData);
                    reportUtils_1.addChild(rels, reportUtils_1.newNonTextNode('Relationship', {
                        Id: htmlId,
                        Type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/aFChunk',
                        Target: "" + htmlName,
                    }));
                }
                finalRelsXml = xml_1.buildXml(rels, {
                    literalXmlDelimiter: DEFAULT_LITERAL_XML_DELIMITER,
                });
                zip_1.zipSetText(zip, relsPath, finalRelsXml);
                _a.label = 2;
            case 2: return [2 /*return*/];
        }
    });
}); };
var getRelsFromZip = function (zip, relsPath) { return __awaiter(void 0, void 0, void 0, function () {
    var relsXml;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, zip_1.zipGetText(zip, relsPath)];
            case 1:
                relsXml = _a.sent();
                if (!relsXml) {
                    relsXml = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n        <Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">\n        </Relationships>";
                }
                return [2 /*return*/, xml_1.parseXml(relsXml)];
        }
    });
}); };
// ==========================================
// Miscellaneous
// ==========================================
var getCmdDelimiter = function (delimiter) {
    if (!delimiter)
        return [DEFAULT_CMD_DELIMITER, DEFAULT_CMD_DELIMITER];
    if (typeof delimiter === 'string')
        return [delimiter, delimiter];
    return delimiter;
};
exports.default = createReport;
