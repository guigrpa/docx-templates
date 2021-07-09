"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logLoop = exports.isLoopExploring = exports.getCurLoop = exports.addChild = exports.newTextNode = exports.newNonTextNode = exports.insertTextSiblingAfter = exports.getNextSibling = exports.cloneNodeForLogging = exports.cloneNodeWithoutChildren = void 0;
var timm_1 = require("timm");
var errors_1 = require("./errors");
var debug_1 = require("./debug");
// ==========================================
// Nodes and trees
// ==========================================
var cloneNodeWithoutChildren = function (node) {
    if (node._fTextNode) {
        return {
            _children: [],
            _fTextNode: true,
            _text: node._text,
        };
    }
    return {
        _children: [],
        _fTextNode: false,
        _tag: node._tag,
        _attrs: node._attrs,
    };
};
exports.cloneNodeWithoutChildren = cloneNodeWithoutChildren;
var cloneNodeForLogging = function (node) {
    return timm_1.omit(node, ['_parent', '_children']);
};
exports.cloneNodeForLogging = cloneNodeForLogging;
var getNextSibling = function (node) {
    var parent = node._parent;
    if (parent == null)
        return null;
    var siblings = parent._children;
    var idx = siblings.indexOf(node);
    if (idx < 0 || idx >= siblings.length - 1)
        return null;
    return siblings[idx + 1];
};
exports.getNextSibling = getNextSibling;
var insertTextSiblingAfter = function (textNode) {
    var tNode = textNode._parent;
    if (!(tNode && !tNode._fTextNode && tNode._tag === 'w:t')) {
        throw new errors_1.TemplateParseError('Template syntax error: text node not within w:t');
    }
    var tNodeParent = tNode._parent;
    if (tNodeParent == null)
        throw new errors_1.TemplateParseError('Template syntax error: w:t node has no parent');
    var idx = tNodeParent._children.indexOf(tNode);
    if (idx < 0)
        throw new errors_1.TemplateParseError('Template syntax error');
    var newTNode = cloneNodeWithoutChildren(tNode);
    newTNode._parent = tNodeParent;
    var newTextNode = {
        _parent: newTNode,
        _children: [],
        _fTextNode: true,
        _text: '',
    };
    newTNode._children = [newTextNode];
    tNodeParent._children.splice(idx + 1, 0, newTNode);
    return newTextNode;
};
exports.insertTextSiblingAfter = insertTextSiblingAfter;
var newNonTextNode = function (tag, attrs, children) {
    if (attrs === void 0) { attrs = {}; }
    if (children === void 0) { children = []; }
    var node = {
        _fTextNode: false,
        _tag: tag,
        _attrs: attrs,
        _children: children,
    };
    node._children.forEach(function (child) {
        child._parent = node;
    });
    return node;
};
exports.newNonTextNode = newNonTextNode;
var newTextNode = function (text) {
    var node = { _children: [], _fTextNode: true, _text: text };
    return node;
};
exports.newTextNode = newTextNode;
var addChild = function (parent, child) {
    parent._children.push(child);
    child._parent = parent;
    return child;
};
exports.addChild = addChild;
// ==========================================
// Loops
// ==========================================
var getCurLoop = function (ctx) {
    if (!ctx.loops.length)
        return null;
    return ctx.loops[ctx.loops.length - 1];
};
exports.getCurLoop = getCurLoop;
var isLoopExploring = function (ctx) {
    var curLoop = getCurLoop(ctx);
    return curLoop != null && curLoop.idx < 0;
};
exports.isLoopExploring = isLoopExploring;
var logLoop = function (loops) {
    if (!loops.length)
        return;
    var level = loops.length - 1;
    var _a = loops[level], varName = _a.varName, idx = _a.idx, loopOver = _a.loopOver, isIf = _a.isIf;
    var idxStr = idx >= 0 ? idx + 1 : 'EXPLORATION';
    debug_1.logger.debug((isIf ? 'IF' : 'FOR') + " loop " +
        ("on " + level + ":" + varName) +
        (idxStr + "/" + loopOver.length));
};
exports.logLoop = logLoop;
