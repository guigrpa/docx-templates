// @flow

import { omit } from 'timm';
import type { Node, TextNode, Context, LoopStatus } from './types';

const DEBUG = process.env.DEBUG_DOCX_TEMPLATES;
const log: any = DEBUG ? require('./debug').mainStory : null;
const chalk: any = DEBUG ? require('./debug').chalk : null;

// ==========================================
// Nodes
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

const cloneNodeForLogging = (node: Node): Object =>
  omit(node, ['_parent', '_children']);

const getNextSibling = (node: Node): ?Node => {
  const parent = node._parent;
  if (parent == null) return null;
  const siblings = parent._children;
  const idx = siblings.indexOf(node);
  if (idx < 0 || idx >= siblings.length - 1) return null;
  return siblings[idx + 1];
};

const insertTextSiblingAfter = (textNode: TextNode): TextNode => {
  const tNode = textNode._parent;
  if (!(tNode && !tNode._fTextNode && tNode._tag === 'w:t')) {
    throw new Error('Template syntax error: text node not within w:t');
  }
  const tNodeParent = tNode._parent;
  if (tNodeParent == null)
    throw new Error('Template syntax error: w:t node has no parent');
  const idx = tNodeParent._children.indexOf(tNode);
  if (idx < 0) throw new Error('Template syntax error');
  const newTNode = cloneNodeWithoutChildren(tNode);
  newTNode._parent = tNodeParent;
  const newTextNode = {
    _parent: newTNode,
    _children: [],
    _fTextNode: true,
    _text: '',
  };
  newTNode._children = [newTextNode];
  tNodeParent._children.splice(idx + 1, 0, newTNode);
  return newTextNode;
};

// ==========================================
// Loops
// ==========================================
const getCurLoop = (ctx: Context) => {
  if (!ctx.loops.length) return null;
  return ctx.loops[ctx.loops.length - 1];
};

const isLoopExploring = (ctx: Context) => {
  const curLoop = getCurLoop(ctx);
  return curLoop != null && curLoop.idx < 0;
};

const logLoop = (loops: Array<LoopStatus>) => {
  if (!DEBUG) return;
  if (!loops.length) return;
  const level = loops.length - 1;
  const { varName, idx, loopOver, isIf } = loops[level];
  const idxStr = idx >= 0 ? idx + 1 : 'EXPLORATION';
  log.debug(
    `${isIf ? 'IF' : 'FOR'} loop ` +
      `on ${chalk.magenta.bold(`${level}:${varName}`)}: ` +
      `${chalk.magenta.bold(idxStr)}/${loopOver.length}`
  );
};

// ==========================================
// Public API
// ==========================================
export {
  cloneNodeWithoutChildren,
  cloneNodeForLogging,
  getNextSibling,
  insertTextSiblingAfter,
  getCurLoop,
  isLoopExploring,
  logLoop,
};
