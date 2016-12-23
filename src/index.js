// @no-flow

/* eslint-disable no-param-reassign */

import path from 'path';
import os from 'os';
import vm from 'vm';
import { omit, merge } from 'timm';
import Promise from 'bluebird';
import fs from 'fs-extra';
import uuid from 'uuid';
import { zipFile, unzipFile } from './zip';
import { parseXml, buildXml } from './xml';
import type { Node, TextNode } from './types';

const DEBUG = process.env.DEBUG_DOCX_TEMPLATES;
const DEFAULT_CMD_DELIMITER = '+++';

let log: any;
let chalk: any;
if (DEBUG) {
  const tmp = require('./debug');  // eslint-disable-line global-require
  log = tmp.mainStory;
  chalk = tmp.chalk;
}

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
    DEBUG && log.debug('Before preprocessing...', {
      attach: jsTemplate,
      attachLevel: 'debug',
      ignoreKeys: ['_parent', '_fTextNode', '_attrs'],
    });
    const finalTemplate = preprocessTemplate(jsTemplate, createOptions);
    DEBUG && log.debug('Generating report...', {
      attach: finalTemplate,
      attachLevel: 'debug',
      ignoreKeys: ['_parent', '_fTextNode', '_attrs'],
    });
    return _createReport(queryResult, finalTemplate, createOptions);
  })

  // Build output XML and write it to disk
  .then((report) => {
    // DEBUG && log.debug('Report', {
    //   attach: report,
    //   attachLevel: 'debug',
    //   ignoreKeys: ['_parent', '_fTextNode', '_attrs'],
    // });
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
// Template preprocessing and report generation
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
  fJump: boolean,
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

type CreateReportOptions = {|
  cmdDelimiter: string,
|};

// In-place
// In case of split commands (or even split delimiters), joins all the pieces
// at the starting node
const preprocessTemplate = (
  template: Node,
  options: CreateReportOptions,
) => {
  const { cmdDelimiter: delimiter } = options;
  let node = template;
  let fCmd = false;
  let openNode = null;
  let idxDelimiter = 0;
  const placeholderCmd = `${delimiter}CMD_NODE${delimiter}`;

  while (node != null) {
    // Add `xml:space` attr `preserve` to `w:t` tags
    if (node._tag === 'w:t') node._attrs['xml:space'] = 'preserve';

    // Process text nodes inside `w:t` tags
    if (node._fTextNode && node._parent._tag === 'w:t') {
      if (openNode == null) openNode = node;
      const textIn = node._text;
      node._text = '';
      for (let i = 0; i < textIn.length; i++) {
        const c = textIn[i];

        // Matches the expected delimiter character
        if (c === delimiter[idxDelimiter]) {
          idxDelimiter += 1;

          // Finished matching delimiter? Then toggle `fCmd`,
          // add a new `w:t` + text node (either before or after the delimiter),
          // depending on the case
          if (idxDelimiter === delimiter.length) {
            fCmd = !fCmd;
            const fNodesMatch = node === openNode;
            if (fCmd && openNode._text.length) {
              openNode = insertTextSiblingAfter(openNode);
              if (fNodesMatch) node = openNode;
            }
            openNode._text += delimiter;
            if (!fCmd && i < textIn.length - 1) {
              openNode = insertTextSiblingAfter(openNode);
              if (fNodesMatch) node = openNode;
            }
            idxDelimiter = 0;
            if (!fCmd) openNode = node;  // may switch open node to the current one
          }

        // Doesn't match the delimiter, but we had some partial match
        } else if (idxDelimiter) {
          openNode._text += delimiter.slice(0, idxDelimiter);
          idxDelimiter = 0;
          if (!fCmd) openNode = node;
          openNode._text += c;

        // General case
        } else {
          openNode._text += c;
        }
      }

      // Close the text node if nothing's pending
      if (!fCmd && !idxDelimiter) openNode = null;

      // If text was present but not any more, add a placeholder, so that this node
      // will be purged during report generation
      if (textIn.length && !node._text.length) node._text = placeholderCmd;
    }

    // Find next node to process
    if (node._children.length) node = node._children[0];
    else {
      let fFound = false;
      while (node._parent != null) {
        const nodeParent: Node = node._parent;
        if (hasNextSibling(node)) {
          fFound = true;
          node = getNextSibling(node);
          break;
        }
        node = nodeParent;
      }
      if (!fFound) node = null;
    }
  }
  return template;
};

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
    fJump: false,
    shorthands: {},
    options,
  };
  let nodeIn: Node = template;
  let nodeOut: Node = out;
  let move;
  let deltaJump;

  while (true) {  // eslint-disable-line no-constant-condition
    const curLoop = getCurLoop(ctx);

    // ---------------------------------------------
    // Move node pointer
    // ---------------------------------------------
    if (ctx.fJump) {
      const { refNode, refNodeLevel } = curLoop;
      // DEBUG && log.debug(`Jumping to level ${refNodeLevel}...`,
      //   { attach: cloneNodeForLogging(refNode) });
      deltaJump = ctx.level - refNodeLevel;
      nodeIn = refNode;
      ctx.level = refNodeLevel;
      ctx.fJump = false;
      move = 'JUMP';

    // Down (only if he haven't just moved up)
    } else if (nodeIn._children.length && move !== 'UP') {
      nodeIn = nodeIn._children[0];
      ctx.level += 1;
      move = 'DOWN';

    // Sideways
    } else if (hasNextSibling(nodeIn)) {
      nodeIn = getNextSibling(nodeIn);
      move = 'SIDE';

    // Up
    } else {
      if (nodeIn._parent == null) break;
      nodeIn = nodeIn._parent;
      ctx.level -= 1;
      move = 'UP';
    }
    // DEBUG && log.debug(`Next node [${chalk.green.bold(move)}]`,
    //   { attach: cloneNodeForLogging(nodeIn) });

    // ---------------------------------------------
    // Process input node
    // ---------------------------------------------
    // Delete the last generated output node if the user inserted a paragraph
    // (or table row) with just a command, or if we're skipping nodes due to an empty FOR loop
    if (move !== 'DOWN') {
      const tag = nodeOut._fTextNode ? null : nodeOut._tag;
      let fRemoveNode = false;
      if ((tag === 'w:p' || tag === 'w:tbl' || tag === 'w:tr') && isLoopExploring(ctx)) {
        // console.log(`Deleting ${tag} automatically ` +
        //   `since we are exploring (curLoop: ${curLoop.varName})`)
        fRemoveNode = true;
      } else if (tag === 'w:p' || tag === 'w:tr') {
        const buffers = ctx.buffers[tag];
        // console.log(`Considering node ${tag} for removal...`)
        // console.log(`text = ${buffers.text}, cmds = ${buffers.cmds}, ` +
        //   `fInsertedText=${buffers.fInsertedText}`);
        fRemoveNode = buffers.text === '' && buffers.cmds !== '' && !buffers.fInsertedText;
        // console.log(`fRemoveNode = ${fRemoveNode}`);
      }
      // Execute removal, if suitable; will no longer be accessible from the parent
      // (but the parent will be accessible from the child)
      if (fRemoveNode && nodeOut._parent != null) {
        nodeOut._parent._children.pop();
      }
    }

    if (move === 'UP') {
      // Loop exploring? Update the reference node for the current loop
      if (isLoopExploring(ctx) && nodeIn === curLoop.refNode._parent) {
        curLoop.refNode = nodeIn;
        curLoop.refNodeLevel -= 1;
        // DEBUG && log.debug(`Updated loop '${curLoop.varName}' refNode:`,
        //   { attach: cloneNodeForLogging(nodeIn) });
      }
      nodeOut = nodeOut._parent;
    }

    // Node creation: DOWN | SIDE
    // Note that nodes are copied to the new tree, but that doesn't mean they will be kept.
    // In some cases, they will be removed later on; for example, when a paragraph only
    // contained a command -- it will be deleted.
    if (move === 'DOWN' || move === 'SIDE') {
      if (move === 'SIDE') nodeOut = nodeOut._parent;
      const tag = nodeIn._fTextNode ? null : nodeIn._tag;
      if (tag === 'w:p' || tag === 'w:tr') {
        ctx.buffers[tag] = { text: '', cmds: '', fInsertedText: false };
      }
      const newNode: Node = cloneNodeWithoutChildren(nodeIn);
      newNode._parent = nodeOut;
      nodeOut._children.push(newNode);
      if (nodeIn._fTextNode && nodeIn._parent._tag === 'w:t') {
        const newNodeAsTextNode: TextNode = (newNode: Object);
        newNodeAsTextNode._text = processText(data, nodeIn, ctx);
      }
      nodeOut = newNode;
    }

    // Correct nodeOut when a jump in nodeIn has occurred
    if (move === 'JUMP') {
      while (deltaJump > 0) {
        nodeOut = nodeOut._parent;
        deltaJump -= 1;
      }
    }
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
    loops: [],
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
    if (nodeIn._fTextNode && nodeIn._parent._tag === 'w:t') processText(null, nodeIn, ctx);
    if (ctx.query != null) break;
  }
  return ctx.query;
};

const processText = (data: ?ReportData, node: TextNode, ctx: Context): string => {
  const { cmdDelimiter } = ctx.options;
  const text = node._text;
  if (text == null || text === '') return '';
  const segments = text.split(cmdDelimiter);
  let outText = '';
  for (let idx = 0; idx < segments.length; idx++) {
    // Include the separators in the `buffers` field (used for deleting paragraphs if appropriate)
    if (idx > 0) appendTextToTagBuffers(cmdDelimiter, ctx, { fCmd: true });

    // Append segment either to the `ctx.cmd` buffer (to be executed), if we are in "command mode",
    // or to the output text
    const segment = segments[idx];
    // DEBUG && log.debug(`Token: '${segment}' (${ctx.fCmd})`);
    if (ctx.fCmd) ctx.cmd += segment;
    else if (!isLoopExploring(ctx)) outText += segment;
    appendTextToTagBuffers(segment, ctx, { fCmd: ctx.fCmd });

    // If there are more segments, execute the command (if we are in "command mode"),
    // and toggle "command mode"
    if (idx < segments.length - 1) {
      if (ctx.fCmd) {
        const cmdResultText = processCmd(data, node, ctx);
        if (cmdResultText != null) {
          outText += cmdResultText;
          appendTextToTagBuffers(cmdResultText, ctx, { fCmd: false, fInsertedText: true });
        }
      }
      ctx.fCmd = !ctx.fCmd;
    }
  }
  return outText;
};

const processCmd = (data: ?ReportData, node: Node, ctx: Context): ?string => {
  let cmd = ctx.cmd.trim();
  ctx.cmd = '';
  const curLoop = getCurLoop(ctx);
  DEBUG && log.debug(`Processing cmd: ${chalk.cyan.bold(cmd)}`);

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
  if (cmdName === 'QUERY' || cmdName === 'CMD_NODE') {
    // DEBUG && log.debug(`Ignoring ${cmdName} command`);

  // SHORTHAND name ANYTHING ELSE THAT MIGHT BE PART OF THE COMMAND...
  } else if (cmdName === 'SHORTHAND') {
    const shorthandName = tokens[1];
    const fullCmd = tokens.slice(2).join(' ');
    ctx.shorthands[shorthandName] = fullCmd;
    DEBUG && log.debug(`Defined shorthand '${shorthandName}' as: ${fullCmd}`);

  // VAR <varName> <dataPath>
  } else if (cmdName === 'VAR') {
    if (!isLoopExploring(ctx)) {
      const varName = tokens[1];
      const code = tokens.slice(2).join(' ');
      const varValue = runUserJsAndGetString(data, code, ctx);
      ctx.vars[varName] = varValue;
      // DEBUG && log.debug(`${varName} is now: ${JSON.stringify(varValue)}`);
    }

  // FOR <varName> IN <collectionDataPath>
  // } else if (cmdName === 'FOR' || cmdName === 'FOR-ROW') {
  } else if (cmdName === 'FOR') {
    const varName = tokens[1];
    // New FOR? If not, discard
    if (!(curLoop && curLoop.varName === varName)) {
      const parentLoopLevel = ctx.loops.length - 1;
      const fParentIsExploring = parentLoopLevel >= 0 && ctx.loops[parentLoopLevel].idx === -1;
      const loopOver = fParentIsExploring
        ? []
        : runUserJsAndGetRaw(data, tokens.slice(3).join(' '), ctx);
        // : extractFromData(data, tokens[3], ctx);
      ctx.loops.push({ refNode: node, refNodeLevel: ctx.level, varName, loopOver, idx: -1 });
    }
    logLoop(ctx.loops);

  // END-FOR
  // } else if (cmdName === 'END-FOR' || cmdName === 'END-FOR-ROW') {
  } else if (cmdName === 'END-FOR') {
    // ctx.pendingCmd = { name: cmdName };
    const varName = tokens[1];
    if (!(curLoop && curLoop.varName === varName)) throw new Error(`Invalid command: ${cmd}`);

    const { loopOver, idx } = curLoop;
    const { nextItem, curIdx } = getNextItem(loopOver, idx);
    if (nextItem) {  // next iteration
      ctx.vars[varName] = nextItem;
      ctx.fJump = true;
      curLoop.idx = curIdx;
    } else {  // loop finished
      ctx.loops.pop();
    }

  // INS <scalarDataPath>
  } else if (cmdName === 'INS') {
    if (!isLoopExploring(ctx)) {
      const code = tokens.slice(1).join(' ');
      out = runUserJsAndGetString(data, code, ctx);
    }

  // Invalid command
  } else throw new Error(`Invalid command syntax: '${cmd}'`);
  return out;
};

const appendTextToTagBuffers = (text: string, ctx: Context, options: {|
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

const runUserJsAndGetString = (data: ?ReportData, code: string, ctx: Context): string => {
  const result = runUserJsAndGetRaw(data, code, ctx);
  return result != null ? String(result) : '';
};

const runUserJsAndGetRaw = (data: ?ReportData, code: string, ctx: Context): any => {
  const sandbox = merge({
    __code__: code,
    __result__: undefined,
  }, data);
  const curLoop = getCurLoop(ctx);
  if (curLoop) sandbox.$idx = curLoop.idx;
  Object.keys(ctx.vars).forEach((varName) => {
    sandbox[`$${varName}`] = ctx.vars[varName];
  });
  const script = new vm.Script(`
    __result__ = eval(__code__);
  `);
  const context = new vm.createContext(sandbox);  // eslint-disable-line new-cap
  script.runInContext(context);
  const result = sandbox.__result__;
  DEBUG && log.debug('JS result', { attach: result });
  return result;
};

const getNextItem = (items, curIdx0) => {
  let nextItem = null;
  let curIdx = curIdx0 != null ? curIdx0 : -1;
  while (nextItem == null) {
    curIdx += 1;
    if (curIdx >= items.length) break;
    if (items[curIdx].isDeleted) continue;
    nextItem = items[curIdx];
  }
  return { nextItem, curIdx };
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

const insertTextSiblingAfter = (textNode: TextNode): TextNode => {
  const tNode = textNode._parent;
  if (!(tNode && tNode._tag === 'w:t')) {
    throw new Error('Template syntax error: text node not within w:t');
  }
  const idx = tNode._parent._children.indexOf(tNode);
  if (idx < 0) throw new Error('Template syntax error');
  const newTNode = cloneNodeWithoutChildren(tNode);
  newTNode._parent = tNode._parent;
  const newTextNode = {
    _parent: newTNode,
    _children: [],
    _fTextNode: true,
    _text: '',
  };
  newTNode._children = [newTextNode];
  tNode._parent._children.splice(idx + 1, 0, newTNode);
  return newTextNode;
};

/* eslint-disable no-unused-vars */
const cloneNodeForLogging = (node: Node): Object =>
  omit(node, ['_parent', '_children']);
/* eslint-enable no-unused-vars */

const getCurLoop = (ctx: Context) => {
  if (!ctx.loops.length) return null;
  return ctx.loops[ctx.loops.length - 1];
};

const isLoopExploring = (ctx: Context) => {
  const curLoop = getCurLoop(ctx);
  return curLoop != null && curLoop.idx < 0;
};

const hasNextSibling = (node: Node): boolean => {
  const parent = node._parent;
  if (parent == null) return false;
  const siblings = parent._children;
  const idx = siblings.indexOf(node);
  return (idx >= 0 && idx < siblings.length - 1);
};

// Always call `hasNextSibling()` before calling `getNextSibling()`
const getNextSibling = (node: Node): ?Node => {
  const parent = node._parent;
  if (parent == null) return null;
  const siblings = parent._children;
  const idx = siblings.indexOf(node);
  if (idx >= 0 && idx < siblings.length - 1) {
    return siblings[idx + 1];
  }
  return null;
};

const logLoop = (loops) => {
  if (!DEBUG) return;
  if (!loops.length) return;
  const level = loops.length - 1;
  const { varName, idx, loopOver } = loops[level];
  const idxStr = idx >= 0 ? idx + 1 : 'EXPLORATION';
  log.debug(`Loop on ${chalk.magenta.bold(`${level}:${varName}`)}: ` +
    `${chalk.magenta.bold(idxStr)}/${loopOver.length}`);
};

// ==========================================
// Public API
// ==========================================
export default createReport;
