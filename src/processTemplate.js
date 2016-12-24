// @flow

/* eslint-disable no-param-reassign */

import {
  cloneNodeWithoutChildren,
  // cloneNodeForLogging,
  getNextSibling,
  getCurLoop, isLoopExploring,
  logLoop,
} from './reportUtils';
import {
  runUserJsAndGetString,
  runUserJsAndGetRaw,
} from './jsSandbox';
import type {
  Node, TextNode,
  ReportData,
  Context, CreateReportOptions,
} from './types';

const DEBUG = process.env.DEBUG_DOCX_TEMPLATES;
const log: any = DEBUG ? require('./debug').mainStory : null;
const chalk: any = DEBUG ? require('./debug').chalk : null;

// Go through the document until the query string is found (normally at the beginning)
const extractQuery = (template: Node, options: CreateReportOptions): ?string => {
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
        const nextSibling = getNextSibling(nodeIn);
        if (nextSibling) {
          nodeIn = nextSibling;
          break;
        }
        nodeIn = parent;
      }
    }

    if (!nodeIn) break;
    const parent = nodeIn._parent;
    if (nodeIn._fTextNode &&
        parent && !parent._fTextNode &&  // Flow, don't complain
        parent._tag === 'w:t'
    ) {
      processText(null, nodeIn, ctx);
    }
    if (ctx.query != null) break;
  }
  return ctx.query;
};

const produceJsReport = (
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
  let deltaJump = 0;

  while (true) {  // eslint-disable-line no-constant-condition
    const curLoop = getCurLoop(ctx);
    let nextSibling;

    // ---------------------------------------------
    // Move node pointer
    // ---------------------------------------------
    if (ctx.fJump) {
      if (!curLoop) throw new Error('INTERNAL_ERROR');
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
    } else if ((nextSibling = getNextSibling(nodeIn))) {
      nodeIn = nextSibling;
      move = 'SIDE';

    // Up
    } else {
      const parent = nodeIn._parent;
      if (parent == null) break;
      nodeIn = parent;
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
      if (isLoopExploring(ctx) &&
          curLoop &&  // Flow, don't complain
          nodeIn === curLoop.refNode._parent) {
        curLoop.refNode = nodeIn;
        curLoop.refNodeLevel -= 1;
        // DEBUG && log.debug(`Updated loop '${curLoop.varName}' refNode:`,
        //   { attach: cloneNodeForLogging(nodeIn) });
      }
      if (nodeOut._parent == null) throw new Error('INTERNAL_ERROR');  // Flow-prevention
      nodeOut = nodeOut._parent;
    }

    // Node creation: DOWN | SIDE
    // Note that nodes are copied to the new tree, but that doesn't mean they will be kept.
    // In some cases, they will be removed later on; for example, when a paragraph only
    // contained a command -- it will be deleted.
    if (move === 'DOWN' || move === 'SIDE') {
      if (move === 'SIDE') {
        if (nodeOut._parent == null) throw new Error('INTERNAL_ERROR');  // Flow-prevention
        nodeOut = nodeOut._parent;
      }
      const tag = nodeIn._fTextNode ? null : nodeIn._tag;
      if (tag === 'w:p' || tag === 'w:tr') {
        ctx.buffers[tag] = { text: '', cmds: '', fInsertedText: false };
      }
      const newNode: Node = cloneNodeWithoutChildren(nodeIn);
      newNode._parent = nodeOut;
      nodeOut._children.push(newNode);
      const parent = nodeIn._parent;
      if (nodeIn._fTextNode &&
          parent && !parent._fTextNode &&  // Flow, don't complain
          parent._tag === 'w:t'
      ) {
        const newNodeAsTextNode: TextNode = (newNode: Object);
        newNodeAsTextNode._text = processText(data, nodeIn, ctx);
      }
      nodeOut = newNode;
    }

    // Correct nodeOut when a jump in nodeIn has occurred
    if (move === 'JUMP') {
      while (deltaJump > 0) {
        if (nodeOut._parent == null) throw new Error('INTERNAL_ERROR');  // Flow-prevention
        nodeOut = nodeOut._parent;
        deltaJump -= 1;
      }
    }
  }

  return out;
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
  try {
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

    // ALIAS name ANYTHING ELSE THAT MIGHT BE PART OF THE COMMAND...
    } else if (cmdName === 'ALIAS') {
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

    // INS <scalarDataPath>
    } else if (cmdName === 'EXEC') {
      if (!isLoopExploring(ctx)) {
        const code = tokens.slice(1).join(' ');
        runUserJsAndGetRaw(data, code, ctx);
      }

    // Invalid command
    } else throw new Error(`Invalid command syntax: '${cmd}'`);
    return out;
  } catch (err) {
    throw new Error(`Error executing command: ${cmd}\n${err.message}`);
  }
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
// Public API
// ==========================================
export {
  extractQuery,
  produceJsReport,
};
