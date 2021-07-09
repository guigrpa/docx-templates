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
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitCommand = exports.getCommand = exports.walkTemplate = exports.findHighestImgId = exports.produceJsReport = exports.extractQuery = exports.newContext = void 0;
var reportUtils_1 = require("./reportUtils");
var jsSandbox_1 = require("./jsSandbox");
var types_1 = require("./types");
var errors_1 = require("./errors");
var debug_1 = require("./debug");
function newContext(options, imageId) {
    if (imageId === void 0) { imageId = 0; }
    return {
        gCntIf: 0,
        level: 1,
        fCmd: false,
        cmd: '',
        fSeekQuery: false,
        buffers: {
            'w:p': { text: '', cmds: '', fInsertedText: false },
            'w:tr': { text: '', cmds: '', fInsertedText: false },
        },
        imageId: imageId,
        images: {},
        linkId: 0,
        links: {},
        htmlId: 0,
        htmls: {},
        vars: {},
        loops: [],
        fJump: false,
        shorthands: {},
        options: options,
    };
}
exports.newContext = newContext;
// Go through the document until the query string is found (normally at the beginning)
function extractQuery(template, options) {
    return __awaiter(this, void 0, void 0, function () {
        var ctx, nodeIn, fFound, parent_1, nextSibling, parent_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    ctx = newContext(options);
                    // ensure no command will be processed, except QUERY
                    ctx.fSeekQuery = true;
                    nodeIn = template;
                    _a.label = 1;
                case 1:
                    if (!true) return [3 /*break*/, 4];
                    // Move down
                    if (nodeIn._children.length)
                        nodeIn = nodeIn._children[0];
                    else {
                        fFound = false;
                        while (nodeIn._parent != null) {
                            parent_1 = nodeIn._parent;
                            nextSibling = reportUtils_1.getNextSibling(nodeIn);
                            if (nextSibling) {
                                nodeIn = nextSibling;
                                fFound = true;
                                break;
                            }
                            nodeIn = parent_1;
                        }
                        if (!fFound)
                            return [3 /*break*/, 4];
                    }
                    if (!nodeIn)
                        return [3 /*break*/, 4];
                    parent_2 = nodeIn._parent;
                    if (!(nodeIn._fTextNode &&
                        parent_2 &&
                        !parent_2._fTextNode && // Flow, don't complain
                        parent_2._tag === 'w:t')) return [3 /*break*/, 3];
                    return [4 /*yield*/, processText(null, nodeIn, ctx, processCmd)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    if (ctx.query != null)
                        return [3 /*break*/, 4];
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, ctx.query];
            }
        });
    });
}
exports.extractQuery = extractQuery;
function produceJsReport(data, template, ctx) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, walkTemplate(data, template, ctx, processCmd)];
        });
    });
}
exports.produceJsReport = produceJsReport;
function findHighestImgId(mainDoc) {
    var doc_ids = [];
    var search = function (n) {
        for (var _i = 0, _a = n._children; _i < _a.length; _i++) {
            var c = _a[_i];
            var tag = c._fTextNode ? null : c._tag;
            if (tag == null)
                continue;
            if (tag === 'wp:docPr') {
                if (c._fTextNode)
                    continue;
                var raw = c._attrs.id;
                if (typeof raw !== 'string')
                    continue;
                var id = Number.parseInt(raw, 10);
                if (Number.isSafeInteger(id))
                    doc_ids.push(id);
            }
            if (c._children.length > 0)
                search(c);
        }
    };
    search(mainDoc);
    if (doc_ids.length > 0)
        return Math.max.apply(Math, doc_ids);
    return 0;
}
exports.findHighestImgId = findHighestImgId;
function walkTemplate(data, template, ctx, processor) {
    return __awaiter(this, void 0, void 0, function () {
        var out, nodeIn, nodeOut, move, deltaJump, errors, curLoop, nextSibling, refNode, refNodeLevel, parent_3, tag, fRemoveNode, buffers, nodeOutParent, imgNode, parent_4, linkNode, parent_5, htmlNode, parent_6, tag, newNode, parent_7, result, newNodeAsTextNode;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    out = reportUtils_1.cloneNodeWithoutChildren(template);
                    nodeIn = template;
                    nodeOut = out;
                    deltaJump = 0;
                    errors = [];
                    _a.label = 1;
                case 1:
                    if (!true) return [3 /*break*/, 5];
                    curLoop = reportUtils_1.getCurLoop(ctx);
                    nextSibling = void 0;
                    // =============================================
                    // Move input node pointer
                    // =============================================
                    if (ctx.fJump) {
                        if (!curLoop)
                            throw new errors_1.InternalError('jumping while curLoop is null');
                        refNode = curLoop.refNode, refNodeLevel = curLoop.refNodeLevel;
                        //
                        //   logger.debug(`Jumping to level ${refNodeLevel}...`, {
                        //     attach: cloneNodeForLogging(refNode),
                        //   });
                        deltaJump = ctx.level - refNodeLevel;
                        nodeIn = refNode;
                        ctx.level = refNodeLevel;
                        ctx.fJump = false;
                        move = 'JUMP';
                        // Down (only if he haven't just moved up)
                    }
                    else if (nodeIn._children.length && move !== 'UP') {
                        nodeIn = nodeIn._children[0];
                        ctx.level += 1;
                        move = 'DOWN';
                        // Sideways
                    }
                    else if ((nextSibling = reportUtils_1.getNextSibling(nodeIn))) {
                        nodeIn = nextSibling;
                        move = 'SIDE';
                        // Up
                    }
                    else {
                        parent_3 = nodeIn._parent;
                        if (parent_3 == null)
                            return [3 /*break*/, 5];
                        nodeIn = parent_3;
                        ctx.level -= 1;
                        move = 'UP';
                    }
                    //
                    //   logger.debug(
                    //     `Next node [${chalk.green.bold(move)}, level ${chalk.dim(ctx.level)}]`,
                    //     { attach: cloneNodeForLogging(nodeIn) }
                    //   );
                    // =============================================
                    // Process input node
                    // =============================================
                    // Delete the last generated output node in several special cases
                    // --------------------------------------------------------------
                    if (move !== 'DOWN') {
                        tag = nodeOut._fTextNode ? null : nodeOut._tag;
                        fRemoveNode = false;
                        // Delete last generated output node if we're skipping nodes due to an empty FOR loop
                        if ((tag === 'w:p' || tag === 'w:tbl' || tag === 'w:tr') &&
                            reportUtils_1.isLoopExploring(ctx)) {
                            fRemoveNode = true;
                            // Delete last generated output node if the user inserted a paragraph
                            // (or table row) with just a command
                        }
                        else if (tag === 'w:p' || tag === 'w:tr') {
                            buffers = ctx.buffers[tag];
                            fRemoveNode =
                                buffers.text === '' && buffers.cmds !== '' && !buffers.fInsertedText;
                        }
                        // Execute removal, if needed. The node will no longer be part of the output, but
                        // the parent will be accessible from the child (so that we can still move up the tree)
                        if (fRemoveNode && nodeOut._parent != null) {
                            nodeOut._parent._children.pop();
                        }
                    }
                    // Handle an UP movement
                    // ---------------------
                    if (move === 'UP') {
                        // Loop exploring? Update the reference node for the current loop
                        if (reportUtils_1.isLoopExploring(ctx) &&
                            curLoop && // Flow, don't complain
                            nodeIn === curLoop.refNode._parent) {
                            curLoop.refNode = nodeIn;
                            curLoop.refNodeLevel -= 1;
                            //
                            //   logger.debug(`Updated loop '${curLoop.varName}' refNode:`, {
                            //     attach: cloneNodeForLogging(nodeIn),
                            //   });
                        }
                        nodeOutParent = nodeOut._parent;
                        if (nodeOutParent == null)
                            throw new errors_1.InternalError('node parent is null');
                        // Execute the move in the output tree
                        nodeOut = nodeOutParent;
                        // If an image was generated, replace the parent `w:t` node with
                        // the image node
                        if (ctx.pendingImageNode &&
                            !nodeOut._fTextNode && // Flow-prevention
                            nodeOut._tag === 'w:t') {
                            imgNode = ctx.pendingImageNode;
                            parent_4 = nodeOut._parent;
                            if (parent_4) {
                                imgNode._parent = parent_4;
                                parent_4._children.pop();
                                parent_4._children.push(imgNode);
                                // Prevent containing paragraph or table row from being removed
                                ctx.buffers['w:p'].fInsertedText = true;
                                ctx.buffers['w:tr'].fInsertedText = true;
                            }
                            delete ctx.pendingImageNode;
                        }
                        // If a link was generated, replace the parent `w:r` node with
                        // the link node
                        if (ctx.pendingLinkNode &&
                            !nodeOut._fTextNode && // Flow-prevention
                            nodeOut._tag === 'w:r') {
                            linkNode = ctx.pendingLinkNode;
                            parent_5 = nodeOut._parent;
                            if (parent_5) {
                                linkNode._parent = parent_5;
                                parent_5._children.pop();
                                parent_5._children.push(linkNode);
                                // Prevent containing paragraph or table row from being removed
                                ctx.buffers['w:p'].fInsertedText = true;
                                ctx.buffers['w:tr'].fInsertedText = true;
                            }
                            delete ctx.pendingLinkNode;
                        }
                        // If a html page was generated, replace the parent `w:p` node with
                        // the html node
                        if (ctx.pendingHtmlNode &&
                            !nodeOut._fTextNode && // Flow-prevention
                            nodeOut._tag === 'w:p') {
                            htmlNode = ctx.pendingHtmlNode;
                            parent_6 = nodeOut._parent;
                            if (parent_6) {
                                htmlNode._parent = parent_6;
                                parent_6._children.pop();
                                parent_6._children.push(htmlNode);
                                // Prevent containing paragraph or table row from being removed
                                ctx.buffers['w:p'].fInsertedText = true;
                                ctx.buffers['w:tr'].fInsertedText = true;
                            }
                            delete ctx.pendingHtmlNode;
                        }
                        // `w:tc` nodes shouldn't be left with no `w:p` children; if that's the
                        // case, add an empty `w:p` inside
                        if (!nodeOut._fTextNode && // Flow-prevention
                            nodeOut._tag === 'w:tc' &&
                            !nodeOut._children.filter(function (o) { return !o._fTextNode && o._tag === 'w:p'; }).length) {
                            nodeOut._children.push({
                                _parent: nodeOut,
                                _children: [],
                                _fTextNode: false,
                                _tag: 'w:p',
                                _attrs: {},
                            });
                        }
                        // Save latest `w:rPr` node that was visited (for LINK properties)
                        if (!nodeIn._fTextNode && nodeIn._tag === 'w:rPr') {
                            ctx.textRunPropsNode = nodeIn;
                        }
                        if (!nodeIn._fTextNode && nodeIn._tag === 'w:r') {
                            delete ctx.textRunPropsNode;
                        }
                    }
                    if (!(move === 'DOWN' || move === 'SIDE')) return [3 /*break*/, 4];
                    // Move nodeOut to point to the new node's parent
                    if (move === 'SIDE') {
                        if (nodeOut._parent == null)
                            throw new errors_1.InternalError('node parent is null');
                        nodeOut = nodeOut._parent;
                    }
                    tag = nodeIn._fTextNode ? null : nodeIn._tag;
                    if (tag === 'w:p' || tag === 'w:tr') {
                        ctx.buffers[tag] = { text: '', cmds: '', fInsertedText: false };
                    }
                    newNode = reportUtils_1.cloneNodeWithoutChildren(nodeIn);
                    newNode._parent = nodeOut;
                    nodeOut._children.push(newNode);
                    parent_7 = nodeIn._parent;
                    if (!(nodeIn._fTextNode &&
                        parent_7 &&
                        !parent_7._fTextNode &&
                        parent_7._tag === 'w:t')) return [3 /*break*/, 3];
                    return [4 /*yield*/, processText(data, nodeIn, ctx, processor)];
                case 2:
                    result = _a.sent();
                    if (typeof result === 'string') {
                        newNodeAsTextNode = newNode;
                        newNodeAsTextNode._text = result;
                    }
                    else {
                        errors.push.apply(errors, result);
                    }
                    _a.label = 3;
                case 3:
                    // Execute the move in the output tree
                    nodeOut = newNode;
                    _a.label = 4;
                case 4:
                    // Correct output tree level in case of a JUMP
                    // -------------------------------------------
                    if (move === 'JUMP') {
                        while (deltaJump > 0) {
                            if (nodeOut._parent == null)
                                throw new errors_1.InternalError('node parent is null');
                            nodeOut = nodeOut._parent;
                            deltaJump -= 1;
                        }
                    }
                    return [3 /*break*/, 1];
                case 5:
                    if (errors.length > 0)
                        return [2 /*return*/, {
                                status: 'errors',
                                errors: errors,
                            }];
                    return [2 /*return*/, {
                            status: 'success',
                            report: out,
                            images: ctx.images,
                            links: ctx.links,
                            htmls: ctx.htmls,
                        }];
            }
        });
    });
}
exports.walkTemplate = walkTemplate;
var processText = function (data, node, ctx, onCommand) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, cmdDelimiter, failFast, text, segments, outText, errors, idx, segment, cmdResultText;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = ctx.options, cmdDelimiter = _a.cmdDelimiter, failFast = _a.failFast;
                text = node._text;
                if (text == null || text === '')
                    return [2 /*return*/, ''];
                segments = text
                    .split(cmdDelimiter[0])
                    .map(function (s) { return s.split(cmdDelimiter[1]); })
                    .reduce(function (x, y) { return x.concat(y); });
                outText = '';
                errors = [];
                idx = 0;
                _b.label = 1;
            case 1:
                if (!(idx < segments.length)) return [3 /*break*/, 5];
                // Include the separators in the `buffers` field (used for deleting paragraphs if appropriate)
                if (idx > 0)
                    appendTextToTagBuffers(cmdDelimiter[0], ctx, { fCmd: true });
                segment = segments[idx];
                // logger.debug(`Token: '${segment}' (${ctx.fCmd})`);
                if (ctx.fCmd)
                    ctx.cmd += segment;
                else if (!reportUtils_1.isLoopExploring(ctx))
                    outText += segment;
                appendTextToTagBuffers(segment, ctx, { fCmd: ctx.fCmd });
                if (!(idx < segments.length - 1)) return [3 /*break*/, 4];
                if (!ctx.fCmd) return [3 /*break*/, 3];
                return [4 /*yield*/, onCommand(data, node, ctx)];
            case 2:
                cmdResultText = _b.sent();
                if (cmdResultText != null) {
                    if (typeof cmdResultText === 'string') {
                        outText += cmdResultText;
                        appendTextToTagBuffers(cmdResultText, ctx, {
                            fCmd: false,
                            fInsertedText: true,
                        });
                    }
                    else {
                        if (failFast)
                            throw cmdResultText;
                        errors.push(cmdResultText);
                    }
                }
                _b.label = 3;
            case 3:
                ctx.fCmd = !ctx.fCmd;
                _b.label = 4;
            case 4:
                idx++;
                return [3 /*break*/, 1];
            case 5:
                if (errors.length > 0)
                    return [2 /*return*/, errors];
                return [2 /*return*/, outText];
        }
    });
}); };
// ==========================================
// Command processor
// ==========================================
var processCmd = function (data, node, ctx) { return __awaiter(void 0, void 0, void 0, function () {
    var cmd, _a, cmdName, cmdRest, aliasMatch, aliasName, fullCmd, result, nerr, str, literalXmlDelimiter, img, e_1, pars, html, err_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                cmd = getCommand(ctx.cmd, ctx.shorthands, ctx.options.fixSmartQuotes);
                ctx.cmd = ''; // flush the context
                debug_1.logger.debug("Processing cmd: " + cmd);
                _b.label = 1;
            case 1:
                _b.trys.push([1, 31, , 32]);
                _a = splitCommand(cmd), cmdName = _a.cmdName, cmdRest = _a.cmdRest;
                // Seeking query?
                if (ctx.fSeekQuery) {
                    if (cmdName === 'QUERY')
                        ctx.query = cmdRest;
                    return [2 /*return*/];
                }
                if (!(cmdName === 'QUERY' || cmdName === 'CMD_NODE')) return [3 /*break*/, 2];
                return [3 /*break*/, 30];
            case 2:
                if (!(cmdName === 'ALIAS')) return [3 /*break*/, 3];
                aliasMatch = /^(\S+)\s+(.+)/.exec(cmdRest);
                if (!aliasMatch)
                    throw new errors_1.InvalidCommandError('Invalid ALIAS command', cmd);
                aliasName = aliasMatch[1];
                fullCmd = aliasMatch[2];
                ctx.shorthands[aliasName] = fullCmd;
                debug_1.logger.debug("Defined alias '" + aliasName + "' for: " + fullCmd);
                return [3 /*break*/, 30];
            case 3:
                if (!(cmdName === 'FOR' || cmdName === 'IF')) return [3 /*break*/, 5];
                return [4 /*yield*/, processForIf(data, node, ctx, cmd, cmdName, cmdRest)];
            case 4:
                _b.sent();
                return [3 /*break*/, 30];
            case 5:
                if (!(cmdName === 'END-FOR' || cmdName === 'END-IF')) return [3 /*break*/, 6];
                processEndForIf(node, ctx, cmd, cmdName, cmdRest);
                return [3 /*break*/, 30];
            case 6:
                if (!(cmdName === 'INS')) return [3 /*break*/, 12];
                if (!!reportUtils_1.isLoopExploring(ctx)) return [3 /*break*/, 11];
                return [4 /*yield*/, jsSandbox_1.runUserJsAndGetRaw(data, cmdRest, ctx)];
            case 7:
                result = _b.sent();
                if (result == null) {
                    return [2 /*return*/, ''];
                }
                if (!(typeof result === 'object' && !Array.isArray(result))) return [3 /*break*/, 10];
                nerr = new errors_1.ObjectCommandResultError(cmdRest);
                if (!(ctx.options.errorHandler != null)) return [3 /*break*/, 9];
                return [4 /*yield*/, ctx.options.errorHandler(nerr, cmdRest)];
            case 8:
                result = _b.sent();
                return [3 /*break*/, 10];
            case 9: throw nerr;
            case 10:
                str = String(result);
                if (ctx.options.processLineBreaks) {
                    literalXmlDelimiter = ctx.options.literalXmlDelimiter;
                    str = str.replace(/\n/g, literalXmlDelimiter + "<w:br/>" + literalXmlDelimiter);
                }
                return [2 /*return*/, str];
            case 11: return [3 /*break*/, 30];
            case 12:
                if (!(cmdName === 'EXEC')) return [3 /*break*/, 15];
                if (!!reportUtils_1.isLoopExploring(ctx)) return [3 /*break*/, 14];
                return [4 /*yield*/, jsSandbox_1.runUserJsAndGetRaw(data, cmdRest, ctx)];
            case 13:
                _b.sent();
                _b.label = 14;
            case 14: return [3 /*break*/, 30];
            case 15:
                if (!(cmdName === 'IMAGE')) return [3 /*break*/, 21];
                if (!!reportUtils_1.isLoopExploring(ctx)) return [3 /*break*/, 20];
                return [4 /*yield*/, jsSandbox_1.runUserJsAndGetRaw(data, cmdRest, ctx)];
            case 16:
                img = _b.sent();
                if (!(img != null)) return [3 /*break*/, 20];
                _b.label = 17;
            case 17:
                _b.trys.push([17, 19, , 20]);
                return [4 /*yield*/, processImage(ctx, img)];
            case 18:
                _b.sent();
                return [3 /*break*/, 20];
            case 19:
                e_1 = _b.sent();
                throw new errors_1.ImageError(e_1.message, cmd);
            case 20: return [3 /*break*/, 30];
            case 21:
                if (!(cmdName === 'LINK')) return [3 /*break*/, 25];
                if (!!reportUtils_1.isLoopExploring(ctx)) return [3 /*break*/, 24];
                return [4 /*yield*/, jsSandbox_1.runUserJsAndGetRaw(data, cmdRest, ctx)];
            case 22:
                pars = _b.sent();
                if (!(pars != null)) return [3 /*break*/, 24];
                return [4 /*yield*/, processLink(ctx, pars)];
            case 23:
                _b.sent();
                _b.label = 24;
            case 24: return [3 /*break*/, 30];
            case 25:
                if (!(cmdName === 'HTML')) return [3 /*break*/, 29];
                if (!!reportUtils_1.isLoopExploring(ctx)) return [3 /*break*/, 28];
                return [4 /*yield*/, jsSandbox_1.runUserJsAndGetRaw(data, cmdRest, ctx)];
            case 26:
                html = _b.sent();
                if (!(html != null)) return [3 /*break*/, 28];
                return [4 /*yield*/, processHtml(ctx, html)];
            case 27:
                _b.sent();
                _b.label = 28;
            case 28: return [3 /*break*/, 30];
            case 29: throw new errors_1.CommandSyntaxError(cmd);
            case 30: return [2 /*return*/];
            case 31:
                err_1 = _b.sent();
                if (ctx.options.errorHandler != null) {
                    return [2 /*return*/, ctx.options.errorHandler(err_1)];
                }
                return [2 /*return*/, err_1];
            case 32: return [2 /*return*/];
        }
    });
}); };
var builtInRegexes = types_1.BUILT_IN_COMMANDS.map(function (word) { return new RegExp("^" + word + "\\b"); });
var notBuiltIns = function (cmd) {
    return !builtInRegexes.some(function (r) { return r.test(cmd.toUpperCase()); });
};
function getCommand(command, shorthands, fixSmartQuotes) {
    // Get a cleaned version of the command
    var cmd = command.trim();
    if (cmd[0] === '*') {
        var aliasName = cmd.slice(1).trim();
        if (!shorthands[aliasName])
            throw new errors_1.InvalidCommandError('Unknown alias', cmd);
        cmd = shorthands[aliasName];
        debug_1.logger.debug("Alias for: " + cmd);
    }
    else if (cmd[0] === '=') {
        cmd = "INS " + cmd.slice(1).trim();
    }
    else if (cmd[0] === '!') {
        cmd = "EXEC " + cmd.slice(1).trim();
    }
    else if (notBuiltIns(cmd)) {
        cmd = "INS " + cmd.trim();
    }
    //replace 'smart' quotes with straight quotes
    if (fixSmartQuotes) {
        cmd = cmd
            .replace(/[\u201C\u201D\u201E]/g, '"')
            .replace(/[\u2018\u2019\u201A]/g, "'");
    }
    return cmd.trim();
}
exports.getCommand = getCommand;
function splitCommand(cmd) {
    // Extract command name
    var cmdNameMatch = /^(\S+)\s*/.exec(cmd);
    var cmdName;
    var cmdRest = '';
    if (cmdNameMatch != null) {
        cmdName = cmdNameMatch[1].toUpperCase();
        cmdRest = cmd.slice(cmdName.length).trim();
    }
    return { cmdName: cmdName, cmdRest: cmdRest };
}
exports.splitCommand = splitCommand;
// ==========================================
// Individual commands
// ==========================================
var processForIf = function (data, node, ctx, cmd, cmdName, cmdRest) { return __awaiter(void 0, void 0, void 0, function () {
    var isIf, forMatch, varName, curLoop, parentLoopLevel, fParentIsExploring, loopOver, shouldRun;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                isIf = cmdName === 'IF';
                if (isIf) {
                    if (!node._ifName) {
                        node._ifName = "__if_" + ctx.gCntIf;
                        ctx.gCntIf += 1;
                    }
                    varName = node._ifName;
                }
                else {
                    forMatch = /^(\S+)\s+IN\s+(.+)/i.exec(cmdRest);
                    if (!forMatch)
                        throw new errors_1.InvalidCommandError('Invalid FOR command', cmd);
                    varName = forMatch[1];
                }
                curLoop = reportUtils_1.getCurLoop(ctx);
                if (!!(curLoop && curLoop.varName === varName)) return [3 /*break*/, 6];
                parentLoopLevel = ctx.loops.length - 1;
                fParentIsExploring = parentLoopLevel >= 0 && ctx.loops[parentLoopLevel].idx === -1;
                loopOver = void 0;
                if (!fParentIsExploring) return [3 /*break*/, 1];
                loopOver = [];
                return [3 /*break*/, 5];
            case 1:
                if (!isIf) return [3 /*break*/, 3];
                return [4 /*yield*/, jsSandbox_1.runUserJsAndGetRaw(data, cmdRest, ctx)];
            case 2:
                shouldRun = !!(_a.sent());
                loopOver = shouldRun ? [1] : [];
                return [3 /*break*/, 5];
            case 3:
                if (!forMatch)
                    throw new errors_1.InvalidCommandError('Invalid FOR command', cmd);
                return [4 /*yield*/, jsSandbox_1.runUserJsAndGetRaw(data, forMatch[2], ctx)];
            case 4:
                loopOver = _a.sent();
                if (!Array.isArray(loopOver))
                    throw new errors_1.InvalidCommandError('Invalid FOR command (can only iterate over Array)', cmd);
                _a.label = 5;
            case 5:
                ctx.loops.push({
                    refNode: node,
                    refNodeLevel: ctx.level,
                    varName: varName,
                    loopOver: loopOver,
                    isIf: isIf,
                    // run through the loop once first, without outputting anything
                    // (if we don't do it like this, we could not run empty loops!)
                    idx: -1,
                });
                _a.label = 6;
            case 6:
                reportUtils_1.logLoop(ctx.loops);
                return [2 /*return*/];
        }
    });
}); };
var processEndForIf = function (node, ctx, cmd, cmdName, cmdRest) {
    var curLoop = reportUtils_1.getCurLoop(ctx);
    if (!curLoop)
        throw new errors_1.InvalidCommandError('Invalid command', cmd);
    var isIf = cmdName === 'END-IF';
    // First time we visit an END-IF node, we assign it the arbitrary name
    // generated when the IF was processed
    if (isIf && !node._ifName)
        node._ifName = curLoop.varName;
    // Check if this is the expected END-IF/END-FOR. If not:
    // - If it's one of the nested varNames, throw
    // - If it's not one of the nested varNames, ignore it; we find
    //   cases in which an END-IF/FOR is found that belongs to a previous
    //   part of the paragraph of the current loop.
    var varName = isIf ? node._ifName : cmdRest;
    if (curLoop.varName !== varName) {
        if (ctx.loops.find(function (o) { return o.varName === varName; }) == null) {
            debug_1.logger.debug("Ignoring " + cmd + " (" + varName + ", but we're expecting " + curLoop.varName + ")");
            return;
        }
        throw new errors_1.InvalidCommandError('Invalid command', cmd);
    }
    var loopOver = curLoop.loopOver, idx = curLoop.idx;
    var _a = getNextItem(loopOver, idx), nextItem = _a.nextItem, curIdx = _a.curIdx;
    if (nextItem != null) {
        // next iteration
        ctx.vars[varName] = nextItem;
        ctx.fJump = true;
        curLoop.idx = curIdx;
    }
    else {
        // loop finished
        ctx.loops.pop();
    }
};
var imageToContext = function (ctx, img) {
    validateImage(img);
    ctx.imageId += 1;
    var id = String(ctx.imageId);
    var relId = "img" + id;
    ctx.images[relId] = img;
    return relId;
};
function validateImage(img) {
    if (!(img.data instanceof Buffer ||
        img.data instanceof ArrayBuffer ||
        typeof img.data === 'string')) {
        throw new Error('image .data property needs to be provided as Buffer, ArrayBuffer, or as a base64-encoded string');
    }
    if (!types_1.ImageExtensions.includes(img.extension)) {
        throw new Error("An extension (one of " + types_1.ImageExtensions + ") needs to be provided when providing an image or a thumbnail.");
    }
}
function validateImagePars(pars) {
    if (!Number.isFinite(pars.width))
        throw new Error("invalid image width: " + pars.width + " (in cm)");
    if (!Number.isFinite(pars.height))
        throw new Error("invalid image height: " + pars.height + " (in cm)");
    validateImage(pars);
    if (pars.thumbnail)
        validateImage(pars.thumbnail);
}
var processImage = function (ctx, imagePars) { return __awaiter(void 0, void 0, void 0, function () {
    var cx, cy, imgRelId, id, alt, node, extNodes, thumbnail, thumbRelId, pic, drawing;
    var _a;
    return __generator(this, function (_b) {
        validateImagePars(imagePars);
        cx = (imagePars.width * 360e3).toFixed(0);
        cy = (imagePars.height * 360e3).toFixed(0);
        imgRelId = imageToContext(ctx, getImageData(imagePars));
        id = String(ctx.imageId);
        alt = imagePars.alt || 'desc';
        node = reportUtils_1.newNonTextNode;
        extNodes = [];
        extNodes.push(node('a:ext', { uri: '{28A0092B-C50C-407E-A947-70E740481C1C}' }, [
            node('a14:useLocalDpi', {
                'xmlns:a14': 'http://schemas.microsoft.com/office/drawing/2010/main',
                val: '0',
            }),
        ]));
        if (ctx.images[imgRelId].extension === '.svg') {
            thumbnail = (_a = imagePars.thumbnail) !== null && _a !== void 0 ? _a : {
                data: 'bm90aGluZwo=',
                extension: '.png',
            };
            thumbRelId = imageToContext(ctx, thumbnail);
            extNodes.push(node('a:ext', { uri: '{96DAC541-7B7A-43D3-8B79-37D633B846F1}' }, [
                node('asvg:svgBlip', {
                    'xmlns:asvg': 'http://schemas.microsoft.com/office/drawing/2016/SVG/main',
                    'r:embed': imgRelId,
                }),
            ]));
            // For SVG the thumb is placed where the image normally goes.
            imgRelId = thumbRelId;
        }
        pic = node('pic:pic', { 'xmlns:pic': 'http://schemas.openxmlformats.org/drawingml/2006/picture' }, [
            node('pic:nvPicPr', {}, [
                node('pic:cNvPr', { id: '0', name: "Picture " + id, descr: alt }),
                node('pic:cNvPicPr', {}, [
                    node('a:picLocks', { noChangeAspect: '1', noChangeArrowheads: '1' }),
                ]),
            ]),
            node('pic:blipFill', {}, [
                node('a:blip', { 'r:embed': imgRelId, cstate: 'print' }, [
                    node('a:extLst', {}, extNodes),
                ]),
                node('a:srcRect'),
                node('a:stretch', {}, [node('a:fillRect')]),
            ]),
            node('pic:spPr', { bwMode: 'auto' }, [
                node('a:xfrm', {}, [
                    node('a:off', { x: '0', y: '0' }),
                    node('a:ext', { cx: cx, cy: cy }),
                ]),
                node('a:prstGeom', { prst: 'rect' }, [node('a:avLst')]),
                node('a:noFill'),
                node('a:ln', {}, [node('a:noFill')]),
            ]),
        ]);
        drawing = node('w:drawing', {}, [
            node('wp:inline', { distT: '0', distB: '0', distL: '0', distR: '0' }, [
                node('wp:extent', { cx: cx, cy: cy }),
                node('wp:docPr', { id: id, name: "Picture " + id, descr: alt }),
                node('wp:cNvGraphicFramePr', {}, [
                    node('a:graphicFrameLocks', {
                        'xmlns:a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
                        noChangeAspect: '1',
                    }),
                ]),
                node('a:graphic', { 'xmlns:a': 'http://schemas.openxmlformats.org/drawingml/2006/main' }, [
                    node('a:graphicData', { uri: 'http://schemas.openxmlformats.org/drawingml/2006/picture' }, [pic]),
                ]),
            ]),
        ]);
        ctx.pendingImageNode = drawing;
        return [2 /*return*/];
    });
}); };
function getImageData(imagePars) {
    var data = imagePars.data, extension = imagePars.extension;
    if (!extension) {
        throw new Error('If you return image `data`, make sure you return an extension as well!');
    }
    return { extension: extension, data: data };
}
var processLink = function (ctx, linkPars) { return __awaiter(void 0, void 0, void 0, function () {
    var url, _a, label, id, relId, node, textRunPropsNode, link;
    return __generator(this, function (_b) {
        url = linkPars.url, _a = linkPars.label, label = _a === void 0 ? url : _a;
        ctx.linkId += 1;
        id = String(ctx.linkId);
        relId = "link" + id;
        ctx.links[relId] = { url: url };
        node = reportUtils_1.newNonTextNode;
        textRunPropsNode = ctx.textRunPropsNode;
        link = node('w:hyperlink', { 'r:id': relId, 'w:history': '1' }, [
            node('w:r', {}, [
                textRunPropsNode ||
                    node('w:rPr', {}, [node('w:rStyle', { 'w:val': 'Hyperlink' })]),
                node('w:t', {}, [reportUtils_1.newTextNode(label)]),
            ]),
        ]);
        ctx.pendingLinkNode = link;
        return [2 /*return*/];
    });
}); };
var processHtml = function (ctx, data) { return __awaiter(void 0, void 0, void 0, function () {
    var id, relId, node, html;
    return __generator(this, function (_a) {
        ctx.htmlId += 1;
        id = String(ctx.htmlId);
        relId = "html" + id;
        ctx.htmls[relId] = data;
        node = reportUtils_1.newNonTextNode;
        html = node('w:altChunk', { 'r:id': relId });
        ctx.pendingHtmlNode = html;
        return [2 /*return*/];
    });
}); };
// ==========================================
// Helpers
// ==========================================
var BufferKeys = ['w:p', 'w:tr'];
var appendTextToTagBuffers = function (text, ctx, options) {
    if (ctx.fSeekQuery)
        return;
    var fCmd = options.fCmd, fInsertedText = options.fInsertedText;
    var type = fCmd ? 'cmds' : 'text';
    BufferKeys.forEach(function (key) {
        var buf = ctx.buffers[key];
        buf[type] += text;
        if (fInsertedText)
            buf.fInsertedText = true;
    });
};
var getNextItem = function (items, curIdx0) {
    var nextItem = null;
    var curIdx = curIdx0 != null ? curIdx0 : -1;
    while (nextItem == null) {
        curIdx += 1;
        if (curIdx >= items.length)
            break;
        var tempItem = items[curIdx];
        if (typeof tempItem === 'object' && tempItem.isDeleted)
            continue;
        nextItem = tempItem;
    }
    return { nextItem: nextItem, curIdx: curIdx };
};
