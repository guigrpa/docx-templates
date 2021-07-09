"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildXml = exports.parseXml = void 0;
var sax_1 = __importDefault(require("sax"));
var debug_1 = require("./debug");
var parseXml = function (templateXml) {
    var parser = sax_1.default.parser(true, {
        // true for XML-like (false for HTML-like)
        trim: false,
        normalize: false,
    });
    var template;
    var curNode = null;
    var numXmlElements = 0;
    return new Promise(function (resolve, reject) {
        parser.onopentag = function (node) {
            var newNode = {
                _parent: curNode || undefined,
                _children: [],
                _fTextNode: false,
                _tag: node.name,
                _attrs: node.attributes,
            };
            if (curNode != null)
                curNode._children.push(newNode);
            else
                template = newNode;
            curNode = newNode;
            numXmlElements += 1;
        };
        parser.onclosetag = function () {
            curNode = curNode != null ? curNode._parent : null;
        };
        parser.ontext = function (text) {
            if (curNode == null)
                return;
            curNode._children.push({
                _parent: curNode,
                _children: [],
                _fTextNode: true,
                _text: text,
            });
        };
        parser.onend = function () {
            debug_1.logger.debug("Number of XML elements: " + numXmlElements);
            resolve(template);
        };
        parser.onerror = function (err) {
            reject(err);
        };
        parser.write(templateXml);
        parser.end();
    });
};
exports.parseXml = parseXml;
var buildXml = function (node, options, indent) {
    if (indent === void 0) { indent = ''; }
    var xml = indent.length
        ? ''
        : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    if (node._fTextNode)
        xml += sanitizeText(node._text, options);
    else {
        var attrs_1 = '';
        var nodeAttrs_1 = node._attrs;
        Object.keys(nodeAttrs_1).forEach(function (key) {
            attrs_1 += " " + key + "=\"" + sanitizeAttr(nodeAttrs_1[key]) + "\"";
        });
        var fHasChildren = node._children.length > 0;
        var suffix = fHasChildren ? '' : '/';
        xml += "\n" + indent + "<" + node._tag + attrs_1 + suffix + ">";
        var fLastChildIsNode_1 = false;
        node._children.forEach(function (child) {
            xml += buildXml(child, options, indent + "  ");
            fLastChildIsNode_1 = !child._fTextNode;
        });
        if (fHasChildren) {
            var indent2 = fLastChildIsNode_1 ? "\n" + indent : '';
            xml += indent2 + "</" + node._tag + ">";
        }
    }
    return xml;
};
exports.buildXml = buildXml;
var sanitizeText = function (str, options) {
    var out = '';
    var segments = str.split(options.literalXmlDelimiter);
    var fLiteral = false;
    for (var i = 0; i < segments.length; i++) {
        var processedSegment = segments[i];
        if (!fLiteral) {
            processedSegment = processedSegment.replace(/&/g, '&amp;'); // must be the first one
            processedSegment = processedSegment.replace(/</g, '&lt;');
            processedSegment = processedSegment.replace(/>/g, '&gt;');
        }
        out += processedSegment;
        fLiteral = !fLiteral;
    }
    return out;
};
var sanitizeAttr = function (attr) {
    var out = typeof attr === 'string' ? attr : attr.value;
    out = out.replace(/&/g, '&amp;'); // must be the first one
    out = out.replace(/</g, '&lt;');
    out = out.replace(/>/g, '&gt;');
    out = out.replace(/'/g, '&apos;');
    out = out.replace(/"/g, '&quot;');
    return out;
};
