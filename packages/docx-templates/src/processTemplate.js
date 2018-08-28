// @flow

/* eslint-disable no-param-reassign, no-constant-condition */

import path from 'path';
import {
  cloneNodeWithoutChildren,
  // cloneNodeForLogging,
  getNextSibling,
  newNonTextNode,
  newTextNode,
  getCurLoop,
  isLoopExploring,
  logLoop
} from './reportUtils';
import { runUserJsAndGetString, runUserJsAndGetRaw } from './jsSandbox';
import type {
  Node,
  TextNode,
  ReportData,
  Context,
  CreateReportOptions,
  ImagePars,
  Images,
  LinkPars,
  Links,
  Htmls
} from './types';

const DEBUG = process.env.DEBUG_DOCX_TEMPLATES;
const log: any = DEBUG ? require('./debug').mainStory : null;
const chalk: any = DEBUG ? require('./debug').chalk : null;

// Load the fs module (will only succeed in node)
let fs;
try {
  fs = require('fs-extra'); // eslint-disable-line
} catch (err) {
  /* ignore */
}

let gCntIf = 0;

// Go through the document until the query string is found (normally at the beginning)
const extractQuery = async (
  template: Node,
  options: CreateReportOptions
): Promise<?string> => {
  const ctx: any = {
    fCmd: false,
    cmd: '',
    fSeekQuery: true, // ensure no command will be processed, except QUERY
    query: null,
    loops: [],
    options
  };
  let nodeIn = template;
  while (true) {
    // Move down
    if (nodeIn._children.length) nodeIn = nodeIn._children[0];
    else {
      // Move sideways or up
      let fFound = false;
      while (nodeIn._parent != null) {
        const parent = nodeIn._parent;
        const nextSibling = getNextSibling(nodeIn);
        if (nextSibling) {
          nodeIn = nextSibling;
          fFound = true;
          break;
        }
        nodeIn = parent;
      }
      if (!fFound) break;
    }

    if (!nodeIn) break;
    const parent = nodeIn._parent;
    if (
      nodeIn._fTextNode &&
      parent &&
      !parent._fTextNode && // Flow, don't complain
      parent._tag === 'w:t'
    ) {
      await processText(null, nodeIn, ctx);
    }
    if (ctx.query != null) break;
  }
  return ctx.query;
};

type ReportOutput = {
  report: Node,
  images: Images,
  links: Links,
  htmls: Htmls
};

const produceJsReport = async (
  data: ?ReportData,
  template: Node,
  options: CreateReportOptions
): Promise<ReportOutput> => {
  const out: Node = cloneNodeWithoutChildren(template);
  const ctx: Context = {
    level: 1,
    fCmd: false,
    cmd: '',
    fSeekQuery: false,
    query: null,
    buffers: {
      'w:p': { text: '', cmds: '', fInsertedText: false },
      'w:tr': { text: '', cmds: '', fInsertedText: false }
    },
    pendingImageNode: null,
    imageId: 0,
    images: {},
    pendingLinkNode: null,
    linkId: 0,
    links: {},
    pendingHtmlNode: null,
    htmlId: 0,
    htmls: {},
    vars: {},
    loops: [],
    fJump: false,
    shorthands: {},
    options
  };
  let nodeIn: Node = template;
  let nodeOut: Node = out;
  let move;
  let deltaJump = 0;

  while (true) {
    // eslint-disable-line no-constant-condition
    const curLoop = getCurLoop(ctx);
    let nextSibling;

    // =============================================
    // Move input node pointer
    // =============================================
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

    // =============================================
    // Process input node
    // =============================================
    // Delete the last generated output node in several special cases
    // --------------------------------------------------------------
    if (move !== 'DOWN') {
      const tag = nodeOut._fTextNode ? null : nodeOut._tag;
      let fRemoveNode = false;
      // Delete last generated output node if we're skipping nodes due to an empty FOR loop
      if (
        (tag === 'w:p' || tag === 'w:tbl' || tag === 'w:tr') &&
        isLoopExploring(ctx)
      ) {
        fRemoveNode = true;
        // Delete last generated output node if the user inserted a paragraph
        // (or table row) with just a command
      } else if (tag === 'w:p' || tag === 'w:tr') {
        const buffers = ctx.buffers[tag];
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
      if (
        isLoopExploring(ctx) &&
        curLoop && // Flow, don't complain
        nodeIn === curLoop.refNode._parent
      ) {
        curLoop.refNode = nodeIn;
        curLoop.refNodeLevel -= 1;
        // DEBUG && log.debug(`Updated loop '${curLoop.varName}' refNode:`,
        //   { attach: cloneNodeForLogging(nodeIn) });
      }
      const nodeOutParent = nodeOut._parent;
      if (nodeOutParent == null) throw new Error('INTERNAL_ERROR'); // Flow-prevention

      // Execute the move in the output tree
      nodeOut = nodeOutParent;

      // If an image was generated, replace the parent `w:t` node with
      // the image node
      if (
        ctx.pendingImageNode &&
        !nodeOut._fTextNode && // Flow-prevention
        nodeOut._tag === 'w:t'
      ) {
        const imgNode = ctx.pendingImageNode;
        const parent = nodeOut._parent;
        if (parent) {
          imgNode._parent = parent;
          parent._children.pop();
          parent._children.push(imgNode);
          // Prevent containing paragraph or table row from being removed
          ctx.buffers['w:p'].fInsertedText = true;
          ctx.buffers['w:tr'].fInsertedText = true;
        }
        ctx.pendingImageNode = null;
      }

      // If a link was generated, replace the parent `w:r` node with
      // the link node
      if (
        ctx.pendingLinkNode &&
        !nodeOut._fTextNode && // Flow-prevention
        nodeOut._tag === 'w:r'
      ) {
        const linkNode = ctx.pendingLinkNode;
        const parent = nodeOut._parent;
        if (parent) {
          linkNode._parent = parent;
          parent._children.pop();
          parent._children.push(linkNode);
          // Prevent containing paragraph or table row from being removed
          ctx.buffers['w:p'].fInsertedText = true;
          ctx.buffers['w:tr'].fInsertedText = true;
        }
        ctx.pendingLinkNode = null;
      }

      // If a html page was generated, replace the parent `w:p` node with
      // the html node
      if (
        ctx.pendingHtmlNode &&
        !nodeOut._fTextNode && // Flow-prevention
        nodeOut._tag === 'w:p'
      ) {
        const htmlNode = ctx.pendingHtmlNode;
        const parent = nodeOut._parent;
        if (parent) {
          htmlNode._parent = parent;
          parent._children.pop();
          parent._children.push(htmlNode);
          // Prevent containing paragraph or table row from being removed
          ctx.buffers['w:p'].fInsertedText = true;
          ctx.buffers['w:tr'].fInsertedText = true;
        }
        ctx.pendingHtmlNode = null;
      }

      // `w:tc` nodes shouldn't be left with no `w:p` children; if that's the
      // case, add an empty `w:p` inside
      if (
        !nodeOut._fTextNode && // Flow-prevention
        nodeOut._tag === 'w:tc' &&
        !nodeOut._children.filter(o => !o._fTextNode && o._tag === 'w:p').length
      ) {
        nodeOut._children.push({
          _parent: nodeOut,
          _children: [],
          _fTextNode: false,
          _tag: 'w:p',
          _attrs: {}
        });
      }
    }

    // Node creation: DOWN | SIDE
    // --------------------------
    // Note that nodes are copied to the new tree, but that doesn't mean they will be kept.
    // In some cases, they will be removed later on; for example, when a paragraph only
    // contained a command -- it will be deleted.
    if (move === 'DOWN' || move === 'SIDE') {
      // Move nodeOut to point to the new node's parent
      if (move === 'SIDE') {
        if (nodeOut._parent == null) throw new Error('INTERNAL_ERROR'); // Flow-prevention
        nodeOut = nodeOut._parent;
      }

      // Reset node buffers as needed if a `w:p` or `w:tr` is encountered
      const tag = nodeIn._fTextNode ? null : nodeIn._tag;
      if (tag === 'w:p' || tag === 'w:tr') {
        ctx.buffers[tag] = { text: '', cmds: '', fInsertedText: false };
      }

      // Clone input node and append to output tree
      const newNode: Node = cloneNodeWithoutChildren(nodeIn);
      newNode._parent = nodeOut;
      nodeOut._children.push(newNode);
      const parent = nodeIn._parent;

      // If it's a text node inside a w:t, process it
      if (
        nodeIn._fTextNode &&
        parent &&
        !parent._fTextNode && // Flow-prevention
        parent._tag === 'w:t'
      ) {
        const newNodeAsTextNode: TextNode = (newNode: Object);
        newNodeAsTextNode._text = await processText(data, nodeIn, ctx);
      }

      // Execute the move in the output tree
      nodeOut = newNode;
    }

    // Correct output tree level in case of a JUMP
    // -------------------------------------------
    if (move === 'JUMP') {
      while (deltaJump > 0) {
        if (nodeOut._parent == null) throw new Error('INTERNAL_ERROR'); // Flow-prevention
        nodeOut = nodeOut._parent;
        deltaJump -= 1;
      }
    }
  }

  return {
    report: out,
    images: ctx.images,
    links: ctx.links,
    htmls: ctx.htmls
  };
};

const processText = async (
  data: ?ReportData,
  node: TextNode,
  ctx: Context
): Promise<string> => {
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
        const cmdResultText = await processCmd(data, node, ctx);
        if (cmdResultText != null) {
          outText += cmdResultText;
          appendTextToTagBuffers(cmdResultText, ctx, {
            fCmd: false,
            fInsertedText: true
          });
        }
      }
      ctx.fCmd = !ctx.fCmd;
    }
  }
  return outText;
};

// ==========================================
// Command processor
// ==========================================
const processCmd = async (
  data: ?ReportData,
  node: Node,
  ctx: Context
): Promise<?string> => {
  const cmd = getCommand(ctx);
  DEBUG && log.debug(`Processing cmd: ${chalk.cyan.bold(cmd)}`);
  try {
    // Extract command name
    const cmdNameMatch = /^(\S+)\s*/.exec(cmd);
    let cmdName;
    let cmdRest = '';
    if (cmdNameMatch != null) {
      cmdName = cmdNameMatch[1].toUpperCase();
      cmdRest = cmd.slice(cmdName.length).trim();
    }

    // Seeking query?
    if (ctx.fSeekQuery) {
      if (cmdName === 'QUERY') ctx.query = cmdRest;
      return null;
    }

    // Process command
    let out;
    if (cmdName === 'QUERY' || cmdName === 'CMD_NODE') {
      // DEBUG && log.debug(`Ignoring ${cmdName} command`);
      // ...
      // ALIAS name ANYTHING ELSE THAT MIGHT BE PART OF THE COMMAND...
    } else if (cmdName === 'ALIAS') {
      const aliasMatch = /^(\S+)\s+(.+)/.exec(cmdRest);
      if (!aliasMatch) throw new Error(`Invalid ALIAS command: ${cmd}`);
      const aliasName = aliasMatch[1];
      const fullCmd = aliasMatch[2];
      ctx.shorthands[aliasName] = fullCmd;
      DEBUG && log.debug(`Defined alias '${aliasName}' for: ${fullCmd}`);

      // VAR <varName> <expression>
      // } else if (cmdName === 'VAR') {
      //   if (!isLoopExploring(ctx)) {
      //     const varMatch = /^(\S+)\s+(.+)/.exec(cmdRest);
      //     if (!varMatch) throw new Error(`Invalid VAR command: ${cmd}`);
      //     const varName = varMatch[1];
      //     const code = varMatch[2];
      //     const varValue = await runUserJsAndGetString(data, code, ctx);
      //     ctx.vars[varName] = varValue;
      //     // DEBUG && log.debug(`${varName} is now: ${JSON.stringify(varValue)}`);
      //   }

      // FOR <varName> IN <expression>
      // IF <expression>
    } else if (cmdName === 'FOR' || cmdName === 'IF') {
      out = await processForIf(data, node, ctx, cmd, cmdName, cmdRest);

      // END-FOR
      // END-IF
    } else if (cmdName === 'END-FOR' || cmdName === 'END-IF') {
      out = processEndForIf(data, node, ctx, cmd, cmdName, cmdRest);

      // INS <expression>
    } else if (cmdName === 'INS') {
      if (!isLoopExploring(ctx))
        out = await runUserJsAndGetString(data, cmdRest, ctx);

      // EXEC <code>
    } else if (cmdName === 'EXEC') {
      if (!isLoopExploring(ctx)) await runUserJsAndGetRaw(data, cmdRest, ctx);

      // IMAGE <code>
    } else if (cmdName === 'IMAGE') {
      if (!isLoopExploring(ctx)) {
        const img = (await runUserJsAndGetRaw(data, cmdRest, ctx): ?ImagePars);
        if (img != null) await processImage(ctx, img);
      }

      // LINK <code>
    } else if (cmdName === 'LINK') {
      if (!isLoopExploring(ctx)) {
        const pars = (await runUserJsAndGetRaw(data, cmdRest, ctx): ?LinkPars);
        if (pars != null) await processLink(ctx, pars);
      }

      // HTML <code>
    } else if (cmdName === 'HTML') {
      if (!isLoopExploring(ctx)) {
        const html = (await runUserJsAndGetRaw(data, cmdRest, ctx): ?string);
        if (html != null) await processHtml(ctx, html);
      }

      // Invalid command
    } else throw new Error(`Invalid command syntax: '${cmd}'`);
    return out;
  } catch (err) {
    throw new Error(`Error executing command: ${cmd}\n${err.message}`);
  }
};

const getCommand = (ctx: Context): string => {
  let { cmd } = ctx;
  if (cmd[0] === '*') {
    const aliasName = cmd.slice(1).trim();
    if (!ctx.shorthands[aliasName]) throw new Error('Unknown alias');
    cmd = ctx.shorthands[aliasName];
    DEBUG && log.debug(`Alias for: ${cmd}`);
  } else if (cmd[0] === '=') {
    cmd = `INS ${cmd.slice(1).trim()}`;
  } else if (cmd[0] === '!') {
    cmd = `EXEC ${cmd.slice(1).trim()}`;
  }
  ctx.cmd = '';
  return cmd.trim();
};

// ==========================================
// Individual commands
// ==========================================
const processForIf = async (
  data: ?ReportData,
  node: Node,
  ctx: Context,
  cmd: string,
  cmdName: string,
  cmdRest: string
): Promise<?string> => {
  const isIf = cmdName === 'IF';

  // Identify FOR/IF loop
  let forMatch;
  let varName;
  if (isIf) {
    if (node._ifName == null) {
      node._ifName = `__if_${gCntIf}`;
      gCntIf += 1;
    }
    varName = node._ifName;
  } else {
    forMatch = /^(\S+)\s+IN\s+(.+)/i.exec(cmdRest);
    if (!forMatch) throw new Error(`Invalid FOR command: ${cmd}`);
    varName = forMatch[1];
  }

  // New FOR? If not, discard
  const curLoop = getCurLoop(ctx);
  if (!(curLoop && curLoop.varName === varName)) {
    const parentLoopLevel = ctx.loops.length - 1;
    const fParentIsExploring =
      parentLoopLevel >= 0 && ctx.loops[parentLoopLevel].idx === -1;
    let loopOver;
    if (fParentIsExploring) {
      loopOver = [];
    } else if (isIf) {
      const shouldRun = !!await runUserJsAndGetRaw(data, cmdRest, ctx);
      loopOver = shouldRun ? [1] : [];
    } else {
      if (!forMatch) throw new Error(`Invalid FOR command: ${cmd}`);
      loopOver = await runUserJsAndGetRaw(data, forMatch[2], ctx);
    }
    ctx.loops.push({
      refNode: node,
      refNodeLevel: ctx.level,
      varName,
      loopOver,
      isIf,
      // run through the loop once first, without outputting anything
      // (if we don't do it like this, we could not run empty loops!)
      idx: -1
    });
  }
  logLoop(ctx.loops);

  return null;
};

const processEndForIf = (
  data: ?ReportData,
  node: Node,
  ctx: Context,
  cmd: string,
  cmdName: string,
  cmdRest: string
): ?string => {
  const curLoop = getCurLoop(ctx);
  if (!curLoop) throw new Error(`Invalid command: ${cmd}`);
  const isIf = cmdName === 'END-IF';
  const varName = isIf ? curLoop.varName : cmdRest;
  if (curLoop.varName !== varName) throw new Error(`Invalid command: ${cmd}`);
  const { loopOver, idx } = curLoop;
  const { nextItem, curIdx } = getNextItem(loopOver, idx);
  if (nextItem != null) {
    // next iteration
    ctx.vars[varName] = nextItem;
    ctx.fJump = true;
    curLoop.idx = curIdx;
  } else {
    // loop finished
    ctx.loops.pop();
  }

  return null;
};

/* eslint-disable */
const processImage = async (ctx: Context, imagePars: ImagePars) => {
  const cx = (imagePars.width * 360e3).toFixed(0);
  const cy = (imagePars.height * 360e3).toFixed(0);
  ctx.imageId += 1;
  const id = String(ctx.imageId);
  const relId = `img${id}`;
  ctx.images[relId] = await getImageData(imagePars);
  const node = newNonTextNode;
  const pic = node(
    'pic:pic',
    { 'xmlns:pic': 'http://schemas.openxmlformats.org/drawingml/2006/picture' },
    [
      node('pic:nvPicPr', {}, [
        node('pic:cNvPr', { id: '0', name: `Picture ${id}`, descr: 'desc' }),
        node('pic:cNvPicPr', {}, [
          node('a:picLocks', { noChangeAspect: '1', noChangeArrowheads: '1' })
        ])
      ]),
      node('pic:blipFill', {}, [
        node('a:blip', { 'r:embed': relId, cstate: 'print' }, [
          node('a:extLst', {}, [
            node('a:ext', { uri: '{28A0092B-C50C-407E-A947-70E740481C1C}' }, [
              node('a14:useLocalDpi', {
                'xmlns:a14':
                  'http://schemas.microsoft.com/office/drawing/2010/main',
                val: '0'
              })
            ])
          ])
        ]),
        node('a:srcRect'),
        node('a:stretch', {}, [node('a:fillRect')])
      ]),
      node('pic:spPr', { bwMode: 'auto' }, [
        node('a:xfrm', {}, [
          node('a:off', { x: '0', y: '0' }),
          node('a:ext', { cx, cy })
        ]),
        node('a:prstGeom', { prst: 'rect' }, [node('a:avLst')]),
        node('a:noFill'),
        node('a:ln', {}, [node('a:noFill')])
      ])
    ]
  );
  const drawing = node('w:drawing', {}, [
    node('wp:inline', { distT: '0', distB: '0', distL: '0', distR: '0' }, [
      node('wp:extent', { cx, cy }),
      node('wp:docPr', { id, name: `Picture ${id}`, descr: 'desc' }),
      node('wp:cNvGraphicFramePr', {}, [
        node('a:graphicFrameLocks', {
          'xmlns:a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
          noChangeAspect: '1'
        })
      ]),
      node(
        'a:graphic',
        { 'xmlns:a': 'http://schemas.openxmlformats.org/drawingml/2006/main' },
        [
          node(
            'a:graphicData',
            { uri: 'http://schemas.openxmlformats.org/drawingml/2006/picture' },
            [pic]
          )
        ]
      )
    ])
  ]);
  ctx.pendingImageNode = drawing;
};

const getImageData = async (imagePars: ImagePars) => {
  const { data, extension } = imagePars;
  if (data) {
    if (!extension) {
      throw new Error(
        'If you return image `data`, make sure you return an extension as well!'
      );
    }
    return { extension, data };
  }
  const { path: imgPath } = imagePars;
  if (!imgPath) throw new Error('Specify either image `path` or `data`');
  if (!fs) throw new Error('Cannot read image from file in the browser');
  const buffer = await fs.readFile(imgPath);
  return { extension: path.extname(imgPath).toLowerCase(), data: buffer };
};

const processLink = async (ctx: Context, linkPars: LinkPars) => {
  const { url } = linkPars;
  const { label = url } = linkPars;
  ctx.linkId += 1;
  const id = String(ctx.linkId);
  const relId = `link${id}`;
  ctx.links[relId] = { url };
  const node = newNonTextNode;
  const link = node('w:hyperlink', { 'r:id': relId, 'w:history': '1' }, [
    node('w:r', {}, [
      node('w:rPr', {}, [node('w:u', { 'w:val': 'single' })]),
      node('w:t', {}, [newTextNode(label)])
    ])
  ]);
  ctx.pendingLinkNode = link;
};

const processHtml = async (ctx: Context, data: string) => {
  ctx.htmlId += 1;
  const id = String(ctx.htmlId);
  const relId = `html${id}`;
  ctx.htmls[relId] = data;
  const node = newNonTextNode;
  const html = node('w:altChunk', { 'r:id': relId });
  ctx.pendingHtmlNode = html;
};

// ==========================================
// Helpers
// ==========================================
const appendTextToTagBuffers = (
  text: string,
  ctx: Context,
  options: {|
    fCmd?: boolean,
    fInsertedText?: boolean
  |}
) => {
  if (ctx.fSeekQuery) return;
  const { fCmd, fInsertedText } = options;
  const type = fCmd ? 'cmds' : 'text';
  Object.keys(ctx.buffers).forEach(key => {
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
    const tempItem = items[curIdx];
    if (typeof tempItem === 'object' && tempItem.isDeleted) continue;
    nextItem = tempItem;
  }
  return { nextItem, curIdx };
};

// ==========================================
// Public API
// ==========================================
export { extractQuery, produceJsReport };
