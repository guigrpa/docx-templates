// @flow

import sax from 'sax';
import type { Node } from './types';

const DEBUG = process.env.DEBUG_DOCX_TEMPLATES;
const log: any = DEBUG ? require('./debug').mainStory : null;

const parseXml = (templateXml: string): Promise<Node> => {
  const parser = sax.parser(true, {
    // true for XML-like (false for HTML-like)
    trim: false,
    normalize: false
  });
  let template;
  let curNode = null;
  let numXmlElements = 0;
  return new Promise((resolve, reject) => {
    parser.onopentag = node => {
      const newNode = {
        _parent: curNode,
        _children: [],
        _fTextNode: false,
        _tag: node.name,
        _attrs: node.attributes
      };
      if (curNode != null) curNode._children.push(newNode);
      else template = newNode;
      curNode = newNode;
      numXmlElements += 1;
    };
    parser.onclosetag = () => {
      curNode = curNode != null ? curNode._parent : null;
    };
    parser.ontext = text => {
      if (curNode == null) return;
      curNode._children.push({
        _parent: curNode,
        _children: [],
        _fTextNode: true,
        _text: text
      });
    };
    parser.onend = () => {
      DEBUG && log.debug(`Number of XML elements: ${numXmlElements}`);
      resolve(template);
    };
    parser.onerror = err => {
      reject(err);
    };
    parser.write(templateXml);
    parser.end();
  });
};

type XmlOptions = {|
  literalXmlDelimiter: string
|};

const buildXml = (node: Node, options: XmlOptions, indent?: string = '') => {
  let xml = indent.length
    ? ''
    : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  if (node._fTextNode) xml += sanitizeText(node._text, options);
  else {
    let attrs = '';
    const nodeAttrs = node._attrs;
    Object.keys(nodeAttrs).forEach(key => {
      attrs += ` ${key}="${sanitizeAttr(nodeAttrs[key])}"`;
    });
    const fHasChildren = node._children.length > 0;
    const suffix = fHasChildren ? '' : '/';
    xml += `\n${indent}<${node._tag}${attrs}${suffix}>`;
    let fLastChildIsNode = false;
    node._children.forEach(child => {
      xml += buildXml(child, options, `${indent}  `);
      fLastChildIsNode = !child._fTextNode;
    });
    if (fHasChildren) {
      const indent2 = fLastChildIsNode ? `\n${indent}` : '';
      xml += `${indent2}</${node._tag}>`;
    }
  }
  return xml;
};

const sanitizeText = (str: string, options: XmlOptions) => {
  let out = '';
  const segments = str.split(options.literalXmlDelimiter);
  let fLiteral = false;
  for (let i = 0; i < segments.length; i++) {
    let processedSegment = segments[i];
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

const sanitizeAttr = (str: string) => {
  let out = str;
  out = out.replace(/&/g, '&amp;'); // must be the first one
  out = out.replace(/</g, '&lt;');
  out = out.replace(/>/g, '&gt;');
  out = out.replace(/'/g, '&apos;');
  out = out.replace(/"/g, '&quot;');
  return out;
};

// ==========================================
// Public API
// ==========================================
export { parseXml, buildXml };
