// @flow

/* eslint-disable no-param-reassign */

import path from 'path';
import os from 'os';
import Promise from 'bluebird';
import fs from 'fs-extra';
import archiver from 'archiver';
import fstream from 'fstream';
import unzip from 'unzip';
import sax from 'sax';
import uuid from 'uuid';

const DEBUG = false;
const DEFAULT_CMD_DELIMITER = '+++';
const LOOP_INDEX_IDENTIFIER = '_idx';

const log: any = DEBUG ? require('./debug') : null;

const fsPromises = {};
['emptyDir', 'ensureDir', 'readFile', 'writeFile', 'remove'].forEach((fn) => {
  fsPromises[fn] = Promise.promisify(fs[fn]);
});

// ==========================================
// Main
// ==========================================
type ReportData = any;
type Query = string;
type QueryResolver = (query: ?Query, queryVars: any) => ReportData | Promise<ReportData>;
type ReportOptions = {|
  template: string,
  data?: ReportData | QueryResolver,
  queryVars?: any,
  output?: string,
  cmdDelimiter?: string,
  _probe?: 'JS' | 'XML',
|};

const getDefaultOutput = (templatePath: string): string => {
  const { dir, name, ext } = path.parse(templatePath);
  return path.join(dir, `${name}_report${ext}`);
};

const createReport = (options: ReportOptions): Promise<any> => {
  DEBUG && log.debug('Report options:', { attach: options });
  const { template, data, queryVars, _probe } = options;
  const output = options.output || getDefaultOutput(template);
  DEBUG && log.debug(`Output file: ${output}`);
  const base = path.join(os.tmpdir(), uuid.v1());
  const baseUnzipped = `${base}_unzipped`;
  DEBUG && log.debug(`Temporary base: ${base}`);
  const createOptions = {
    cmdDelimiter: options.cmdDelimiter || DEFAULT_CMD_DELIMITER,
  };

  let jsTemplate;
  let queryResult = null;
  const templatePath = `${base}_unzipped/word/document.xml`;
  let tic;
  let result;
  return Promise.resolve()

  // Unzip
  .then(() => {
    DEBUG && log.debug('Unzipping...');
    return fsPromises.emptyDir(baseUnzipped)
    .then(() => unzipFile(template, baseUnzipped));
  })

  // Read the 'document.xml' file (the template) and parse it
  .then(() => {
    DEBUG && log.debug('Reading template...');
    return fsPromises.readFile(templatePath, 'utf8')
    .then((templateXml) => {
      DEBUG && log.debug(`Template file length: ${templateXml.length}`);
      DEBUG && log.debug('Parsing XML...');
      tic = new Date().getTime();
      return parseXml(templateXml);
    }).then((parseResult) => {
      jsTemplate = parseResult;
      const tac = new Date().getTime();
      DEBUG && log.debug(`File parsed in ${tac - tic} ms`,
        { attach: jsTemplate, attachLevel: 'trace' });
    });
  })

  // Fetch the data that will fill in the template
  .then(() => {
    if (typeof data !== 'function') {
      queryResult = data;
      return null;
    }
    DEBUG && log.debug('Looking for the query in the template...');
    const query = getQuery(jsTemplate, createOptions);
    DEBUG && log.debug(`Query: ${query || 'no query found'}`);
    return Promise.resolve(data(query, queryVars)).then((o) => { queryResult = o; });
  })

  // Generate the report
  .then(() => {
    DEBUG && log.debug('Generating report...');
    return _createReport(queryResult, jsTemplate, createOptions);
  })

  // Build output XML and write it to disk
  .then((report) => {
    result = report;
    if (_probe === 'JS') {
      result = report;
      return null;
    }
    DEBUG && log.debug('Converting report to XML...');
    const reportXml = buildXml(report);
    if (_probe === 'XML') {
      result = reportXml;
      return null;
    }
    DEBUG && log.debug('Writing report...');
    return fsPromises.writeFile(templatePath, reportXml);
  })

  // Zip the results
  .then(() => {
    if (_probe) {
      return fsPromises.remove(baseUnzipped)
      .then(() => result);
    }
    DEBUG && log.debug('Zipping...');
    return fsPromises.ensureDir(path.dirname(output))
    .then(() => zipFile(baseUnzipped, output))
    .finally(() => fsPromises.remove(baseUnzipped));
  });
};

// ==========================================
// Report generation
// ==========================================
type Context = {
  level: number,
  fCmd: boolean,
  cmd: string,
  fSeekQuery: boolean,
  query: ?Query,
  buffers: {
    'w:p': BufferStatus,
    'w:tr': BufferStatus,
  },
  vars: { [name: string]: VarValue },
  loops: Array<LoopStatus>,
  pendingCmd: ?PendingCommand,
  skipAtLevel: ?number,
  shorthands: { [shorthand: string]: string },
  options: CreateReportOptions,
};

type BufferStatus = {
  text: string,
  cmds: string,
  fInsertedText: boolean,
};

type VarValue = any;
type LoopStatus = {
  forNode: Node,
  varName: string,
  loopOver: Array<VarValue>,
  idx: number,
};

type PendingCommand = Object;

type CreateReportOptions = {|
  cmdDelimiter: string,
|};

const _createReport = (
  data: ?ReportData,
  template: Node,
  options: CreateReportOptions,
): Node => {
  const out: Node = cloneNodeWithoutChildren(template);
  const ctx: Context = {
    level: 1,
    fCmd: false,
    cmd: '',
    fSeekQuery: false,
    query: null,
    buffers: {
      'w:p': { text: '', cmds: '', fInsertedText: false },
      'w:tr': { text: '', cmds: '', fInsertedText: false },
    },
    vars: {},
    loops: [],
    root: template,
    pendingCmd: null,
    skipAtLevel: null,
    shorthands: {},
    options,
  };
  let nodeIn: Node = template;
  let nodeOut: Node = out;

  // ---------------------------------------------
  // Fetch a new node
  // ---------------------------------------------
  while (true) {  // eslint-disable-line no-constant-condition
    // ---------------------------------------------
    // Fetch a new node, case 1: go down...
    // ---------------------------------------------
    if (nodeIn._children.length) {
      nodeIn = nodeIn._children[0];
      ctx.level += 1;

    // ---------------------------------------------
    // Fetch a new node, case 2: go to the next sibling
    // (at the same level or a higher one)
    // ---------------------------------------------
    } else {
      let fFound = false;
      while (nodeIn._parent != null) {
        const nodeInParent: Node = nodeIn._parent;
        const nodeOutParent: ?Node = nodeOut._parent;
        if (hasNextSibling(nodeIn)) {
          fFound = true;
          nodeIn = getNextSibling(nodeIn);
          break;
        }
        nodeIn = nodeInParent;
        if (nodeOutParent == null) break;  // should never happen
        nodeOut = nodeOutParent;
        ctx.level -= 1;

        // On the way up, process commands applicable at `w:p` (paragraph) and
        // `w:tr` (table row) level
        const tag = nodeIn._fTextNode ? null : nodeIn._tag;
        const { pendingCmd } = ctx;
        if (pendingCmd != null) {
          const cmdName = pendingCmd.name;
          if (
            (tag === 'w:p' && (cmdName === 'FOR' || cmdName === 'END-FOR')) ||
            (tag === 'w:tr' && (cmdName === 'FOR-ROW' || cmdName === 'END-FOR-ROW'))
          ) {
            if (cmdName === 'FOR' || cmdName === 'FOR-ROW') {
              const { loopOver, varName } = pendingCmd;
              DEBUG && log.debug(`Loop ${varName} iterations: ${loopOver.length}`);
              if (ctx.skipAtLevel == null) {
                const { nextItem, curIdx } = getNextItem(loopOver);
                if (nextItem) {
                  ctx.loops.push({ forNode: nodeIn, varName, loopOver, idx: curIdx });
                  ctx.vars[varName] = nextItem;
                } else {
                  ctx.skipAtLevel = ctx.level;
                }
              }
            } else if (cmdName === 'END-FOR' || cmdName === 'END-FOR-ROW') {
              if (ctx.level === ctx.skipAtLevel) {
                ctx.skipAtLevel = null;
              } else if (ctx.skipAtLevel == null) {
                const curLoop = ctx.loops[ctx.loops.length - 1];
                const { forNode, varName, loopOver, idx } = curLoop;
                const { nextItem, curIdx } = getNextItem(loopOver, idx);
                if (nextItem) {  // repeat loop
                  DEBUG && log.debug(`  - Iteration on ${varName}: ${idx + 1}`);
                  curLoop.idx = curIdx;
                  ctx.vars[varName] = nextItem;
                  nodeIn = forNode;
                } else {  // loop finished
                  ctx.loops.pop();
                }
              }
            }
            ctx.pendingCmd = null;
          }
        }

        // On the way up, delete corresponding output node if the user inserted a paragraph
        // (or table row) with just a command, or if we're skipping nodes due to an empty FOR loop
        let fRemoveNode = false;
        if (
          (tag === 'w:p' || tag === 'w:tbl' || tag === 'w:tr') &&
          ctx.skipAtLevel != null &&
          ctx.level >= ctx.skipAtLevel
        ) {
          fRemoveNode = true;
        } else if (tag === 'w:p' || tag === 'w:tr') {
          const buffers = ctx.buffers[tag];
          // console.log(`${tag} FULLTEXT: '${buffers.text}'`);
          // console.log(`${tag} COMMANDS: '${buffers.cmds}'`);
          fRemoveNode = buffers.text === '' && buffers.cmds !== '' && !buffers.fInsertedText;
        }
        if (fRemoveNode && nodeOut._parent != null) nodeOut._parent._children.pop();
      }

      // Reached the parent and still no luck? We're done generating the report!
      if (!fFound) break;

      // In the output tree, move up one level, to correct the attachment point
      // for the new node
      nodeOut = (nodeOut._parent: any);
    }

    // ---------------------------------------------
    // Process node
    // ---------------------------------------------
    // Nodes are copied to the new tree, but that doesn't mean they will be kept there.
    // In some cases, they will be removed later on; for example, when a paragraph only
    // contained a command -- it will be deleted.
    const tag = nodeIn._fTextNode ? null : nodeIn._tag;
    if (tag === 'w:p' || tag === 'w:tr') {
      ctx.buffers[tag] = { text: '', cmds: '', fInsertedText: false };
    }
    const newNode: Node = cloneNodeWithoutChildren(nodeIn);
    newNode._parent = nodeOut;
    nodeOut._children.push(newNode);
    if (nodeIn._fTextNode) {
      const newNodeAsTextNode: TextNode = (newNode: Object);
      newNodeAsTextNode._text = processText(data, nodeIn, ctx);
    }
    nodeOut = newNode;
  }

  return out;
};

// Go through the document until the query string is found (normally at the beginning)
const getQuery = (template: Node, options: CreateReportOptions): ?string => {
  const ctx: any = {
    fCmd: false,
    cmd: '',
    fSeekQuery: true,  // ensure no command will be processed, except QUERY
    query: null,
    options,
  };
  let nodeIn = template;
  while (true) {  // eslint-disable-line no-constant-condition
    // Move down
    if (nodeIn._children.length) nodeIn = nodeIn._children[0];

    // Move sideways or up
    else {
      while (nodeIn._parent != null) {
        const parent = nodeIn._parent;
        if (hasNextSibling(nodeIn)) {
          nodeIn = getNextSibling(nodeIn);
          break;
        }
        nodeIn = parent;
      }
    }

    if (!nodeIn) break;
    if (nodeIn._fTextNode) processText(null, nodeIn, ctx);
    if (ctx.query != null) break;
  }
  return ctx.query;
};

// Include isDeleted field in all GraphQL nodes
// const addIsDeleted = (query) => {
//   let out = '';
//   let parens = 0;
//   let level = 0;
//   let fQuoted = false;
//   for (let i = 0; i < query.length; i++) {
//     const c = query[i];
//     let moreChars = c;
//     if (c === '(') parens += 1;
//     else if (c === ')') parens -= 1;
//     else if (c === '"') fQuoted = !fQuoted;
//     else if (c === '{') {
//       level += 1;
//       if (level >= 2 && !parens && !fQuoted) {
//         moreChars = '{isDeleted, ';
//       }
//     } else if (c === '}') level -= 1;
//     out += moreChars;
//   }
//   return out;
// };

const processText = (data: ?ReportData, node: TextNode, ctx: Context): string => {
  const { cmdDelimiter } = ctx.options;
  const text = node._text;
  if (text == null || text === '') return '';
  const segments = text.split(cmdDelimiter);
  let outText = '';
  const fAppendText = node._parent && !node._parent._fTextNode && node._parent._tag === 'w:t';
  for (let idx = 0; idx < segments.length; idx++) {
    // Include the separators in the `buffers` field (used for deleting paragraphs if appropriate)
    if (idx > 0 && fAppendText) appendText(cmdDelimiter, ctx, { fCmd: true });

    // Append segment either to the `ctx.cmd` buffer (to be executed), if we are in "command mode",
    // or to the output text
    const segment = segments[idx];
    // DEBUG && log.debug(`Token: '${segment}'' (${ctx.fCmd})`);
    if (ctx.fCmd) ctx.cmd += segment;
    else outText += segment;
    if (fAppendText) appendText(segment, ctx, { fCmd: ctx.fCmd });

    // If there are more segments, execute the command (if we are in "command mode"),
    // and toggle "command mode"
    if (idx < segments.length - 1) {
      if (ctx.fCmd) {
        const cmdResultText = processCmd(data, ctx);
        if (cmdResultText != null) {
          outText += cmdResultText;
          if (fAppendText) appendText(cmdResultText, ctx, { fCmd: false, fInsertedText: true });
        }
      }
      ctx.fCmd = !ctx.fCmd;
    }
  }
  return outText;
};

const processCmd = (data: ?ReportData, ctx: Context): ?string => {
  let cmd = ctx.cmd.trim();
  ctx.cmd = '';
  DEBUG && log.debug(`Executing: ${cmd}`);

  // Expand shorthands
  const shorthandMatch = /^\[(.+)\]$/.exec(cmd);  // eslint-disable-line no-useless-escape
  if (shorthandMatch != null) {
    const shorthandName = shorthandMatch[1];
    cmd = ctx.shorthands[shorthandName];
    DEBUG && log.debug(`Shorthand for: ${cmd}`);
  }

  // Sanitize, tokenize and extract command name
  cmd = cmd.replace(/\s+/g, ' ');
  const tokens = cmd.split(' ');
  if (!tokens.length) throw new Error('Invalid command syntax');
  const cmdName = tokens[0].toUpperCase();

  // Seeking query?
  if (ctx.fSeekQuery) {
    if (cmdName === 'QUERY') ctx.query = tokens.slice(1).join(' ');
    return null;
  }

  // Process command
  let out;
  if (cmdName === 'QUERY') {
    DEBUG && log.debug('Ignoring QUERY command');
  } else if (cmdName === 'SHORTHAND') {
    const shorthandName = tokens[1];
    const fullCmd = tokens.slice(2).join(' ');
    ctx.shorthands[shorthandName] = fullCmd;
    DEBUG && log.debug(`Defined shorthand '${shorthandName}' as: ${fullCmd}`);
  } else if (cmdName === 'VAR') {  // VAR <varName> <dataPath>
    const varName = tokens[1];
    const varPath = tokens[2];
    const varValue = extractFromData(data, varPath, ctx);
    ctx.vars[varName] = varValue;
    // DEBUG && log.debug(`${varName} is now: ${JSON.stringify(varValue)}`);
  } else if (cmdName === 'FOR' || cmdName === 'FOR-ROW') {
      // FOR <varName> IN <collectionDataPath>
    ctx.pendingCmd = {
      name: cmdName,
      varName: tokens[1],
      loopOver: extractFromData(data, tokens[3], ctx),
    };
  } else if (cmdName === 'END-FOR' || cmdName === 'END-FOR-ROW') {
      // END-FOR
    ctx.pendingCmd = { name: cmdName };
  } else if (cmdName === 'INS') {  // INS <scalarDataPath>
    if (ctx.skipAtLevel == null) out = extractFromData(data, tokens[1], ctx);
  } else throw new Error(`Invalid command syntax: '${cmd}'`);
  return out;
};

const appendText = (text: string, ctx: Context, options: {|
  fCmd?: boolean,
  fInsertedText?: boolean,
|}) => {
  if (ctx.fSeekQuery) return;
  const { fCmd, fInsertedText } = options;
  const type = fCmd ? 'cmds' : 'text';
  Object.keys(ctx.buffers).forEach((key) => {
    const buf = ctx.buffers[key];
    buf[type] += text;
    if (fInsertedText) buf.fInsertedText = true;
  });
};

const extractFromData = (data: ?ReportData, dataPath: string, ctx: Context): VarValue => {
  if (data == null) return '';
  const parts = dataPath.split('.');
  let out;
  if (parts[0][0] === '$') {
    const varName = parts[0].substring(1);
    out = ctx.vars[varName];
    parts.shift();
    if (
      parts.length &&
      parts[0] === LOOP_INDEX_IDENTIFIER &&
      (typeof out !== 'object' || out[LOOP_INDEX_IDENTIFIER] == null)
    ) {
      const loop = ctx.loops.find((o) => o.varName === varName);
      if (loop) return loop.idx + 1;
    }
  } else {
    out = data;
  }
  if (out == null) return '';
  for (let i = 0; i < parts.length; i++) {
    out = out[parts[i]];
    if (out == null) return '';
  }
  return out;
};

const getNextItem = (items, curIdx0) => {
  let nextItem = null;
  let curIdx = curIdx0 != null ? curIdx0 : -1;
  while (nextItem == null) {
    curIdx += 1;
    if (curIdx >= items.length) break;
    if (items[curIdx].isDeleted) continue;  // TODO: allow user skipping
    nextItem = items[curIdx];
  }
  return { nextItem, curIdx };
};

// ==========================================
// Utilities: XML <-> JSON conversion
// ==========================================
type BaseNode = {
  _parent: ?Node,
  _children: Array<Node>,
  _idxChild?: ?number,
};
type TextNode = BaseNode & {
  _fTextNode: true,
  _text: string,
};
type NonTextNode = BaseNode & {
  _fTextNode: false,
  _tag: string,
  _attrs: Object,
};
type Node = TextNode | NonTextNode;

const parseXml = (templateXml): Promise<Node> => {
  const parser = sax.parser(true, {  // true for XML-like (false for HTML-like)
    trim: false,
    normalize: false,
  });
  let template;
  let curNode = null;
  let numXmlElements = 0;
  return new Promise((resolve, reject) => {
    parser.onopentag = (node) => {
      const newNode = {
        _parent: curNode,
        _children: [],
        _idxChild: curNode != null ? curNode._children.length : undefined,
        _fTextNode: false,
        _tag: node.name,
        _attrs: node.attributes,
      };
      if (curNode != null) curNode._children.push(newNode);
      else template = newNode;
      curNode = newNode;
      numXmlElements += 1;
    };
    parser.onclosetag = () => { curNode = curNode != null ? curNode._parent : null; };
    parser.ontext = (text) => {
      if (curNode == null) return;
      curNode._children.push({
        _parent: curNode,
        _children: [],
        _idxChild: curNode._children.length,
        _fTextNode: true,
        _text: text,
      });
    };
    parser.onend = () => {
      DEBUG && log.debug(`Number of XML elements: ${numXmlElements}`);
      resolve(template);
    };
    parser.onerror = (err) => { reject(err); };
    parser.write(templateXml);
    parser.end();
  });
};

const buildXml = (node: Node, indent = '') => {
  let xml = indent.length ? '' : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  if (node._fTextNode) xml += sanitizeText(node._text);
  else {
    let attrs = '';
    const nodeAttrs = node._attrs;
    Object.keys(nodeAttrs).forEach((key) => {
      attrs += ` ${key}="${nodeAttrs[key]}"`;
    });
    const fHasChildren = node._children.length > 0;
    const suffix = fHasChildren ? '' : '/';
    xml += `\n${indent}<${node._tag}${attrs}${suffix}>`;
    let fLastChildIsNode = false;
    node._children.forEach((child) => {
      xml += buildXml(child, `${indent}  `);
      fLastChildIsNode = !child._fTextNode;
    });
    if (fHasChildren) {
      const indent2 = fLastChildIsNode ? `\n${indent}` : '';
      xml += `${indent2}</${node._tag}>`;
    }
  }
  return xml;
};

const sanitizeText = (str: string) => {
  let out = str;
  out = out.replace(/&/g, '&amp;');  // must be the first one
  out = out.replace(/</g, '&lt;');
  out = out.replace(/>/g, '&gt;');
  return out;
};

// ==========================================
// Utilities: miscellaneous
// ==========================================
const cloneNodeWithoutChildren = (node: Node): Node => {
  if (node._fTextNode) {
    return {
      _parent: null,
      _children: [],
      _fTextNode: true,
      _text: node._text,
    };
  }
  return {
    _parent: null,
    _children: [],
    _fTextNode: false,
    _tag: node._tag,
    _attrs: node._attrs,
  };
};

const hasNextSibling = (node: Node): boolean => (
  node._parent != null && node._idxChild != null
    ? node._idxChild < node._parent._children.length - 1
    : false
);

// Always call `hasNextSibling()` before calling `getNextSibling()`
const getNextSibling = (node: Node): Node =>
  // $FlowFixMe
  (node._parent._children[node._idxChild + 1]: Node);

// ==========================================
// Utilities: zip/unzip
// ==========================================
const unzipFile = (inputFile, outputFolder) => {
  const readStream = fs.createReadStream(inputFile);
  const writeStream = fstream.Writer(outputFolder);  // eslint-disable-line new-cap
  return new Promise((resolve) => {
    readStream
    .pipe(unzip.Parse())  // eslint-disable-line new-cap
    .pipe(writeStream)
    .on('close', resolve);
  });
};

const zipFile = (inputFolder, outputFile) => {
  const output = fs.createWriteStream(outputFile);
  const archive = archiver('zip');
  return new Promise((resolve, reject) => {
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);
    archive.bulk([{ expand: true, dot: true, cwd: inputFolder, src: '**' }]);
    archive.finalize();
  });
};

// ==========================================
// Public API
// ==========================================
export default createReport;
