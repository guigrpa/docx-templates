import {
  cloneNodeWithoutChildren,
  getNextSibling,
  newNonTextNode,
  newTextNode,
  getCurLoop,
  isLoopExploring,
  logLoop,
} from './reportUtils';
import { runUserJsAndGetRaw } from './jsSandbox';
import {
  Node,
  TextNode,
  ReportData,
  Context,
  CreateReportOptions,
  ImagePars,
  Images,
  LinkPars,
  Links,
  Htmls,
  Image,
  BUILT_IN_COMMANDS,
  ImageExtensions,
  NonTextNode,
} from './types';
import {
  isError,
  CommandSyntaxError,
  InternalError,
  InvalidCommandError,
  ImageError,
  ObjectCommandResultError,
  IncompleteConditionalStatementError,
  UnterminatedForLoopError,
} from './errors';
import { logger } from './debug';

export function newContext(
  options: CreateReportOptions,
  imageAndShapeIdIncrement = 0
): Context {
  return {
    gCntIf: 0,
    gCntEndIf: 0,
    level: 1,
    fCmd: false,
    cmd: '',
    fSeekQuery: false,
    buffers: {
      'w:p': { text: '', cmds: '', fInsertedText: false },
      'w:tr': { text: '', cmds: '', fInsertedText: false },
      'w:tc': { text: '', cmds: '', fInsertedText: false },
    },
    imageAndShapeIdIncrement,
    images: {},
    linkId: 0,
    links: {},
    htmlId: 0,
    htmls: {},
    vars: {},
    loops: [],
    fJump: false,
    shorthands: {},
    options,
    // To verfiy we don't have a nested if within the same p or tr tag
    pIfCheckMap: new Map(),
    trIfCheckMap: new Map(),
  };
}

// Go through the document until the query string is found (normally at the beginning)
export async function extractQuery(
  template: Node,
  options: CreateReportOptions
): Promise<string | undefined> {
  const ctx: Context = newContext(options);

  // ensure no command will be processed, except QUERY
  ctx.fSeekQuery = true;

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
      !parent._fTextNode &&
      parent._tag === 'w:t'
    ) {
      await processText(null, nodeIn, ctx, processCmd);
    }
    if (ctx.query != null) break;
  }
  return ctx.query;
}

type ReportOutput =
  | {
      status: 'success';
      report: Node;
      images: Images;
      links: Links;
      htmls: Htmls;
    }
  | {
      status: 'errors';
      errors: Error[];
    };

export async function produceJsReport(
  data: ReportData | undefined,
  template: Node,
  ctx: Context
): Promise<ReportOutput> {
  return walkTemplate(data, template, ctx, processCmd);
}

export function findHighestImgId(mainDoc: Node): number {
  const doc_ids: number[] = [];
  const search = (n: Node) => {
    for (const c of n._children) {
      const tag = c._fTextNode ? null : c._tag;
      if (tag == null) continue;
      if (tag === 'wp:docPr') {
        if (c._fTextNode) continue;
        const raw = c._attrs.id;
        if (typeof raw !== 'string') continue;
        const id = Number.parseInt(raw, 10);
        if (Number.isSafeInteger(id)) doc_ids.push(id);
      }
      if (c._children.length > 0) search(c);
    }
  };
  search(mainDoc);
  if (doc_ids.length > 0) return Math.max(...doc_ids);
  return 0;
}

const debugPrintNode = (node: Node) =>
  JSON.stringify(
    node._fTextNode
      ? {
          _ifName: node._ifName,
          _fTextNode: node._fTextNode,
          _text: node?._text,
        }
      : {
          _ifName: node._ifName,
          _fTextNode: node._fTextNode,
          _tag: node?._tag,
          _attrs: node?._attrs,
        }
  );

const findParentPorTrNode = (node: Node) => {
  let parentNode = node._parent;
  let resultNode = null;
  while (parentNode != null && resultNode == null) {
    const parentNodeTag = parentNode._fTextNode ? null : parentNode._tag;
    if (parentNodeTag === 'w:p') {
      // check also for w:tr tag
      const grandParentNode =
        parentNode._parent != null ? parentNode._parent._parent : null;
      if (
        grandParentNode != null &&
        !grandParentNode._fTextNode &&
        grandParentNode._tag === 'w:tr'
      ) {
        resultNode = grandParentNode;
      } else {
        resultNode = parentNode;
      }
    }
    parentNode = parentNode._parent;
  }
  return resultNode;
};

export async function walkTemplate(
  data: ReportData | undefined,
  template: Node,
  ctx: Context,
  processor: CommandProcessor
): Promise<ReportOutput> {
  const out: Node = cloneNodeWithoutChildren(template);
  let nodeIn: Node = template;
  let nodeOut: Node = out;
  let move;
  let deltaJump = 0;
  const errors: Error[] = [];

  let loopCount = 0;
  const maximumWalkingDepth = ctx.options?.maximumWalkingDepth || 1_000_000;
  while (true) {
    const curLoop = getCurLoop(ctx);
    let nextSibling: Node | null = null;

    // =============================================
    // Move input node pointer
    // =============================================
    if (ctx.fJump) {
      if (!curLoop) throw new InternalError('jumping while curLoop is null');
      // TODO: comment debug statements back out, as creating the debug string creates overhead.
      logger.debug(
        `Jumping to level ${curLoop.refNodeLevel}...`,
        debugPrintNode(curLoop.refNode)
      );
      deltaJump = ctx.level - curLoop.refNodeLevel;
      nodeIn = curLoop.refNode;
      ctx.level = curLoop.refNodeLevel;
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
      if (parent == null) {
        logger.debug(
          `=== parent is null, breaking after ${loopCount} loops...`
        );
        break;
      } else if (loopCount > maximumWalkingDepth) {
        // adding a emergency exit to avoid infit loops
        logger.debug(
          `=== parent is still not null after ${loopCount} loops, something must be wrong ...`,
          debugPrintNode(parent)
        );
        throw new InternalError(
          'infinite loop or massive dataset detected. Please review and try again'
        );
      }
      nodeIn = parent;
      ctx.level -= 1;
      move = 'UP';
    }

    logger.debug(
      `Next node [${move}, level ${ctx.level}]`,
      debugPrintNode(nodeIn)
    );

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
        (tag === 'w:p' ||
          tag === 'w:tbl' ||
          tag === 'w:tr' ||
          tag === 'w:tc') &&
        isLoopExploring(ctx)
      ) {
        fRemoveNode = true;
        // Delete last generated output node if the user inserted a paragraph
        // (or table row) with just a command
      } else if (tag === 'w:p' || tag === 'w:tr' || tag === 'w:tc') {
        const buffers = ctx.buffers[tag];
        fRemoveNode =
          buffers.text === '' && buffers.cmds !== '' && !buffers.fInsertedText;

        // If the last generated output node is a table row, and it is set to be deleted,
        // don't delete if it has exactly one nested row (i.e. within nested table)
        if (tag === 'w:tr' && fRemoveNode) {
          fRemoveNode =
            nodeIn._children.filter(
              child => !child._fTextNode && child._tag === 'w:tr'
            ).length !== 1;
        }

        // If the last generated output node is a table column, and it is set to be deleted,
        // don't delete if it has a table as a child
        if (tag === 'w:tc' && fRemoveNode) {
          fRemoveNode = !(
            nodeOut._children.filter(
              child => !child._fTextNode && child._tag === 'w:tbl'
            ).length > 0
          );
        }
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
        curLoop &&
        nodeIn === curLoop.refNode._parent
      ) {
        curLoop.refNode = nodeIn;
        curLoop.refNodeLevel -= 1;
        logger.debug(
          `Updated loop '${curLoop.varName}' refNode: ` + debugPrintNode(nodeIn)
        );
      }
      const nodeOutParent = nodeOut._parent;
      if (nodeOutParent == null) throw new InternalError('node parent is null');

      // Execute the move in the output tree
      nodeOut = nodeOutParent;

      // If an image was generated, replace the parent `w:t` node with
      // the image node
      if (
        ctx.pendingImageNode &&
        !nodeOut._fTextNode &&
        nodeOut._tag === 'w:t'
      ) {
        const imgNode = ctx.pendingImageNode.image;
        const captionNodes = ctx.pendingImageNode.caption;
        const parent = nodeOut._parent;
        if (parent) {
          imgNode._parent = parent;
          parent._children.pop();
          parent._children.push(imgNode);
          if (captionNodes) {
            parent._children.push(...captionNodes);
          }

          // Prevent containing paragraph or table row from being removed
          ctx.buffers['w:p'].fInsertedText = true;
          ctx.buffers['w:tr'].fInsertedText = true;
          ctx.buffers['w:tc'].fInsertedText = true;
        }
        delete ctx.pendingImageNode;
      }

      // If a link was generated, replace the parent `w:r` node with
      // the link node
      if (
        ctx.pendingLinkNode &&
        !nodeOut._fTextNode &&
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
          ctx.buffers['w:tc'].fInsertedText = true;
        }
        delete ctx.pendingLinkNode;
      }

      // If a html page was generated, replace the parent `w:p` node with
      // the html node
      if (
        ctx.pendingHtmlNode &&
        !nodeOut._fTextNode &&
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
          ctx.buffers['w:tc'].fInsertedText = true;
        }
        delete ctx.pendingHtmlNode;
      }

      // `w:tc` nodes shouldn't be left with no `w:p` or 'w:altChunk' children; if that's the
      // case, add an empty `w:p` inside
      if (
        !nodeOut._fTextNode &&
        nodeOut._tag === 'w:tc' &&
        !nodeOut._children.filter(
          o => !o._fTextNode && (o._tag === 'w:p' || o._tag === 'w:altChunk')
        ).length
      ) {
        nodeOut._children.push({
          _parent: nodeOut,
          _children: [],
          _fTextNode: false,
          _tag: 'w:p',
          _attrs: {},
        });
      }

      // Save latest `w:rPr` node that was visited (for LINK properties)
      if (!nodeOut._fTextNode && nodeOut._tag === 'w:rPr') {
        ctx.textRunPropsNode = nodeOut;
      }
      if (!nodeIn._fTextNode && nodeIn._tag === 'w:r') {
        delete ctx.textRunPropsNode;
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
        if (nodeOut._parent == null)
          throw new InternalError('node parent is null');
        nodeOut = nodeOut._parent;
      }

      // Reset node buffers as needed if a `w:p` or `w:tr` is encountered
      const tag = nodeIn._fTextNode ? null : nodeIn._tag;
      if (tag === 'w:p' || tag === 'w:tr' || tag === 'w:tc') {
        ctx.buffers[tag] = { text: '', cmds: '', fInsertedText: false };
      }

      // Clone input node and append to output tree
      const newNode: Node = cloneNodeWithoutChildren(nodeIn);

      newNode._parent = nodeOut;
      nodeOut._children.push(newNode);

      // Update shape IDs in mc:AlternateContent
      const newNodeTag = (newNode as NonTextNode)._tag;
      if (
        !isLoopExploring(ctx) &&
        (newNodeTag === 'wp:docPr' || newNodeTag === 'v:shape')
      ) {
        logger.debug('detected a - ', debugPrintNode(newNode));
        updateID(newNode as NonTextNode, ctx);
      }

      const parent = nodeIn._parent;

      // If it's a text node inside a w:t, process it
      if (
        nodeIn._fTextNode &&
        parent &&
        !parent._fTextNode &&
        parent._tag === 'w:t'
      ) {
        const result = await processText(data, nodeIn, ctx, processor);
        if (typeof result === 'string') {
          // TODO: improve typesafety of conversion Node to TextNode.
          (newNode as TextNode)._text = result;
          logger.debug(
            `Inserted command result string into node. Updated node: ` +
              debugPrintNode(newNode)
          );
        } else {
          errors.push(...result);
        }
      }

      // Execute the move in the output tree
      nodeOut = newNode;
    }

    // JUMP to the target level of the tree.
    // -------------------------------------------
    if (move === 'JUMP') {
      while (deltaJump > 0) {
        if (nodeOut._parent == null)
          throw new InternalError('node parent is null');
        nodeOut = nodeOut._parent;
        deltaJump -= 1;
      }
    }

    loopCount++;
  }

  if (ctx.gCntIf !== ctx.gCntEndIf) {
    const err = new IncompleteConditionalStatementError();
    if (ctx.options.failFast) {
      throw err;
    } else {
      errors.push(err);
    }
  }

  if (ctx.loops.filter(l => !l.isIf).length > 0) {
    const innermost_loop = ctx.loops[ctx.loops.length - 1];
    const err = new UnterminatedForLoopError(innermost_loop);
    if (ctx.options.failFast) {
      throw err;
    } else {
      errors.push(err);
    }
  }

  if (errors.length > 0)
    return {
      status: 'errors',
      errors,
    };

  return {
    status: 'success',
    report: out,
    images: ctx.images,
    links: ctx.links,
    htmls: ctx.htmls,
  };
}

type CommandProcessor = (
  data: ReportData | undefined,
  node: Node,
  ctx: Context
) => Promise<undefined | string | Error>;

const processText = async (
  data: ReportData | undefined,
  node: TextNode,
  ctx: Context,
  onCommand: CommandProcessor
): Promise<string | Error[]> => {
  const { cmdDelimiter, failFast } = ctx.options;
  const text = node._text;
  if (text == null || text === '') return '';
  const segments = text
    .split(cmdDelimiter[0])
    .map(s => s.split(cmdDelimiter[1]))
    .reduce((x, y) => x.concat(y));
  let outText = '';
  const errors: Error[] = [];
  for (let idx = 0; idx < segments.length; idx++) {
    // Include the separators in the `buffers` field (used for deleting paragraphs if appropriate)
    if (idx > 0) appendTextToTagBuffers(cmdDelimiter[0], ctx, { fCmd: true });

    // Append segment either to the `ctx.cmd` buffer (to be executed), if we are in "command mode",
    // or to the output text
    const segment = segments[idx];
    // logger.debug(`Token: '${segment}' (${ctx.fCmd})`);
    if (ctx.fCmd) ctx.cmd += segment;
    else if (!isLoopExploring(ctx)) outText += segment;
    appendTextToTagBuffers(segment, ctx, { fCmd: ctx.fCmd });

    // If there are more segments, execute the command (if we are in "command mode"),
    // and toggle "command mode"
    if (idx < segments.length - 1) {
      if (ctx.fCmd) {
        const cmdResultText = await onCommand(data, node, ctx);
        if (cmdResultText != null) {
          if (typeof cmdResultText === 'string') {
            outText += cmdResultText;
            appendTextToTagBuffers(cmdResultText, ctx, {
              fCmd: false,
              fInsertedText: true,
            });
          } else {
            if (failFast) throw cmdResultText;
            errors.push(cmdResultText);
          }
        }
      }
      ctx.fCmd = !ctx.fCmd;
    }
  }
  if (errors.length > 0) return errors;
  return outText;
};

// ==========================================
// Command processor
// ==========================================
const processCmd: CommandProcessor = async (
  data: ReportData | undefined,
  node: Node,
  ctx: Context
): Promise<undefined | string | Error> => {
  const cmd = getCommand(ctx.cmd, ctx.shorthands, ctx.options.fixSmartQuotes);
  ctx.cmd = ''; // flush the context
  const { cmdName, cmdRest } = splitCommand(cmd);
  try {
    if (cmdName !== 'CMD_NODE') logger.debug(`Processing cmd: ${cmd}`);
    // Seeking query?
    if (ctx.fSeekQuery) {
      if (cmdName === 'QUERY') ctx.query = cmdRest;
      return;
    }

    // Process command
    if (cmdName === 'QUERY' || cmdName === 'CMD_NODE') {
      // logger.debug(`Ignoring ${cmdName} command`);
      // ...
      // ALIAS name ANYTHING ELSE THAT MIGHT BE PART OF THE COMMAND...
    } else if (cmdName === 'ALIAS') {
      const aliasMatch = /^(\S+)\s+(.+)/.exec(cmdRest);
      if (!aliasMatch)
        throw new InvalidCommandError('Invalid ALIAS command', cmd);
      const aliasName = aliasMatch[1];
      const fullCmd = aliasMatch[2];
      ctx.shorthands[aliasName] = fullCmd;
      logger.debug(`Defined alias '${aliasName}' for: ${fullCmd}`);

      // FOR <varName> IN <expression>
      // IF <expression>
    } else if (cmdName === 'FOR' || cmdName === 'IF') {
      await processForIf(data, node, ctx, cmd, cmdName, cmdRest);

      // END-FOR
      // END-IF
    } else if (cmdName === 'END-FOR' || cmdName === 'END-IF') {
      const result = processEndForIf(node, ctx, cmd, cmdName, cmdRest);
      if (typeof result === 'string') {
        return result;
      }

      // INS <expression>
    } else if (cmdName === 'INS') {
      if (!isLoopExploring(ctx)) {
        let result = await runUserJsAndGetRaw(data, cmdRest, ctx);
        if (result == null) {
          return '';
        }
        if (typeof result === 'object' && !Array.isArray(result)) {
          const nerr = new ObjectCommandResultError(cmdRest, result);
          if (ctx.options.errorHandler != null) {
            result = await ctx.options.errorHandler(nerr, cmdRest);
          } else {
            throw nerr;
          }
        }

        // If the `processLineBreaks` flag is set,
        // newlines are replaced with a `w:br` tag (protected by
        // the `literalXmlDelimiter` separators)
        let str = String(result);
        if (ctx.options.processLineBreaks) {
          const { literalXmlDelimiter } = ctx.options;
          if (ctx.options.processLineBreaksAsNewText) {
            const splitByLineBreak = str.split('\n');
            const LINE_BREAK = `${literalXmlDelimiter}<w:br/>${literalXmlDelimiter}`;
            const END_OF_TEXT = `${literalXmlDelimiter}</w:t>${literalXmlDelimiter}`;
            const START_OF_TEXT = `${literalXmlDelimiter}<w:t xml:space="preserve">${literalXmlDelimiter}`;
            str = splitByLineBreak.join(
              `${END_OF_TEXT}${LINE_BREAK}${START_OF_TEXT}`
            );
          } else {
            str = str.replace(
              /\n/g,
              `${literalXmlDelimiter}<w:br/>${literalXmlDelimiter}`
            );
          }
        }
        return str;
      }

      // EXEC <code>
    } else if (cmdName === 'EXEC') {
      if (!isLoopExploring(ctx)) await runUserJsAndGetRaw(data, cmdRest, ctx);

      // IMAGE <code>
    } else if (cmdName === 'IMAGE') {
      if (!isLoopExploring(ctx)) {
        const img: ImagePars | undefined = await runUserJsAndGetRaw(
          data,
          cmdRest,
          ctx
        );
        if (img != null) {
          try {
            processImage(ctx, img);
          } catch (e) {
            if (!isError(e)) throw e;
            throw new ImageError(e, cmd);
          }
        }
      }

      // LINK <code>
    } else if (cmdName === 'LINK') {
      if (!isLoopExploring(ctx)) {
        const pars: LinkPars | undefined = await runUserJsAndGetRaw(
          data,
          cmdRest,
          ctx
        );
        if (pars != null) await processLink(ctx, pars);
      }

      // HTML <code>
    } else if (cmdName === 'HTML') {
      if (!isLoopExploring(ctx)) {
        const html: string | undefined = await runUserJsAndGetRaw(
          data,
          cmdRest,
          ctx
        );
        if (html != null) await processHtml(ctx, html);
      }

      // Invalid command
    } else throw new CommandSyntaxError(cmd);
    return;
  } catch (err) {
    if (!isError(err)) throw err;
    if (ctx.options.errorHandler != null) {
      return ctx.options.errorHandler(err, cmdRest);
    }
    return err;
  }
};

const builtInRegexes = BUILT_IN_COMMANDS.map(word => new RegExp(`^${word}\\b`));

const notBuiltIns = (cmd: string) =>
  !builtInRegexes.some(r => r.test(cmd.toUpperCase()));

export function getCommand(
  command: string,
  shorthands: Context['shorthands'],
  fixSmartQuotes: boolean
): string {
  // Get a cleaned version of the command

  let cmd = command.trim();
  if (cmd[0] === '*') {
    const aliasName = cmd.slice(1).trim();
    if (!shorthands[aliasName])
      throw new InvalidCommandError('Unknown alias', cmd);
    cmd = shorthands[aliasName];
    logger.debug(`Alias for: ${cmd}`);
  } else if (cmd[0] === '=') {
    cmd = `INS ${cmd.slice(1).trim()}`;
  } else if (cmd[0] === '!') {
    cmd = `EXEC ${cmd.slice(1).trim()}`;
  } else if (notBuiltIns(cmd)) {
    cmd = `INS ${cmd.trim()}`;
  }

  //replace 'smart' quotes with straight quotes
  if (fixSmartQuotes) {
    cmd = cmd
      .replace(/[\u201C\u201D\u201E]/g, '"')
      .replace(/[\u2018\u2019\u201A]/g, "'");
  }

  return cmd.trim();
}

export function splitCommand(cmd: string) {
  // Extract command name
  const cmdNameMatch = /^(\S+)\s*/.exec(cmd);
  let cmdName;
  let cmdRest = '';
  if (cmdNameMatch != null) {
    cmdName = cmdNameMatch[1].toUpperCase();
    cmdRest = cmd.slice(cmdName.length).trim();
  }

  return { cmdName, cmdRest };
}

// ==========================================
// Individual commands
// ==========================================
const processForIf = async (
  data: ReportData | undefined,
  node: Node,
  ctx: Context,
  cmd: string,
  cmdName: string,
  cmdRest: string
): Promise<void> => {
  const isIf = cmdName === 'IF';

  // Identify FOR/IF loop
  let forMatch: RegExpExecArray | null = null;
  let varName: string | undefined = undefined;
  if (isIf) {
    if (!node._ifName) {
      node._ifName = `__if_${ctx.gCntIf}`;
      ctx.gCntIf += 1;
    }
    varName = node._ifName;
  } else {
    forMatch = /^(\S+)\s+IN\s+(.+)/i.exec(cmdRest);
    if (!forMatch) throw new InvalidCommandError('Invalid FOR command', cmd);
    varName = forMatch[1];
  }

  // Have we already seen this node or is it the start of a new FOR loop?
  const curLoop = getCurLoop(ctx);
  if (!(curLoop && curLoop.varName === varName)) {
    // Check whether we already started a nested IF without and END-IF for this p or tr tag
    if (isIf) {
      const parentPorTrNode = findParentPorTrNode(node);
      const parentPorTrNodeTag =
        parentPorTrNode != null
          ? parentPorTrNode._fTextNode
            ? null
            : parentPorTrNode._tag
          : null;
      if (parentPorTrNode != null) {
        if (parentPorTrNodeTag === 'w:p') {
          if (
            ctx.pIfCheckMap.has(parentPorTrNode) &&
            ctx.pIfCheckMap.get(parentPorTrNode) !== cmd
          )
            throw new InvalidCommandError(
              'Invalid IF command nested into another IF command on the same line',
              cmd
            );
          else ctx.pIfCheckMap.set(parentPorTrNode, cmd);
        } else if (parentPorTrNodeTag === 'w:tr') {
          if (
            ctx.trIfCheckMap.has(parentPorTrNode) &&
            ctx.trIfCheckMap.get(parentPorTrNode) !== cmd
          )
            throw new InvalidCommandError(
              'Invalid IF command nested into another IF command on the same table row',
              cmd
            );
          else ctx.trIfCheckMap.set(parentPorTrNode, cmd);
        }
      }
    }

    const parentLoopLevel = ctx.loops.length - 1;
    const fParentIsExploring =
      parentLoopLevel >= 0 && ctx.loops[parentLoopLevel].idx === -1;
    let loopOver: unknown[];
    if (fParentIsExploring) {
      loopOver = [];
    } else if (isIf) {
      const shouldRun = !!(await runUserJsAndGetRaw(data, cmdRest, ctx));
      loopOver = shouldRun ? [1] : [];
    } else {
      if (!forMatch) throw new InvalidCommandError('Invalid FOR command', cmd);
      loopOver = await runUserJsAndGetRaw(data, forMatch[2], ctx);
      if (!Array.isArray(loopOver))
        throw new InvalidCommandError(
          'Invalid FOR command (can only iterate over Array)',
          cmd
        );
    }
    ctx.loops.push({
      refNode: node,
      refNodeLevel: ctx.level,
      varName,
      loopOver,
      isIf,
      // run through the loop once first, without outputting anything
      // (if we don't do it like this, we could not run empty loops!)
      idx: -1,
    });
  }
  logLoop(ctx.loops);
};

const processEndForIf = (
  node: Node,
  ctx: Context,
  cmd: string,
  cmdName: string,
  cmdRest: string
): string | undefined => {
  const isIf = cmdName === 'END-IF';
  const curLoop = getCurLoop(ctx);
  if (!curLoop)
    throw new InvalidCommandError(
      `Unexpected ${cmdName} outside of ${
        isIf ? 'IF statement' : 'FOR loop'
      } context`,
      cmd
    );

  // Reset the if check flag for the corresponding p or tr parent node
  const parentPorTrNode = findParentPorTrNode(node);
  const parentPorTrNodeTag =
    parentPorTrNode != null
      ? parentPorTrNode._fTextNode
        ? null
        : parentPorTrNode._tag
      : null;
  if (parentPorTrNodeTag === 'w:p') {
    ctx.pIfCheckMap.delete(<Node>parentPorTrNode);
  } else if (parentPorTrNodeTag === 'w:tr') {
    ctx.trIfCheckMap.delete(<Node>parentPorTrNode);
  }

  // First time we visit an END-IF node, we assign it the arbitrary name
  // generated when the IF was processed
  if (isIf && !node._ifName) {
    node._ifName = curLoop.varName;
    ctx.gCntEndIf += 1;
  }

  // Check if this is the expected END-IF/END-FOR. If not:
  // - If it's one of the nested varNames, throw
  // - If it's not one of the nested varNames, ignore it; we find
  //   cases in which an END-IF/FOR is found that belongs to a previous
  //   part of the paragraph of the current loop.
  const varName = isIf ? node._ifName : cmdRest;
  if (curLoop.varName !== varName) {
    if (ctx.loops.find(o => o.varName === varName) == null) {
      logger.debug(
        `Ignoring ${cmd} (${varName}, but we're expecting ${curLoop.varName})`
      );
      return;
    }
    throw new InvalidCommandError('Invalid command', cmd);
  }

  // Get the next item in the loop
  const nextIdx = curLoop.idx + 1;
  const nextItem = curLoop.loopOver[nextIdx];

  if (nextItem != null) {
    // next iteration
    ctx.vars[varName] = nextItem;
    ctx.fJump = true;
    curLoop.idx = nextIdx;
  } else {
    // loop finished
    ctx.loops.pop();
    const paragraphPropertiesNode =
      node._parent?._parent?._parent?._children[0];
    if (
      paragraphPropertiesNode &&
      paragraphPropertiesNode._children[0] &&
      (paragraphPropertiesNode._children[0] as NonTextNode)._tag === 'w:sectPr'
    ) {
      return ''; // If this paragraph has section properties, we don't want to remove it, so we return an empty string
    }
  }
};

const imageToContext = (ctx: Context, img: Image) => {
  validateImage(img);
  ctx.imageAndShapeIdIncrement += 1;
  const id = String(ctx.imageAndShapeIdIncrement);
  const relId = `img${id}`;
  ctx.images[relId] = img;
  return relId;
};

function validateImage(img: Image) {
  if (
    !(
      img.data instanceof Uint8Array ||
      img.data instanceof ArrayBuffer ||
      typeof img.data === 'string'
    )
  ) {
    throw new Error(
      'image .data property needs to be provided as Uint8Array (e.g. Buffer), ArrayBuffer, or as a base64-encoded string'
    );
  }
  if (!ImageExtensions.includes(img.extension)) {
    throw new Error(
      `An extension (one of ${ImageExtensions}) needs to be provided when providing an image or a thumbnail.`
    );
  }
}

function validateImagePars(pars: ImagePars) {
  if (!Number.isFinite(pars.width))
    throw new Error(`invalid image width: ${pars.width} (in cm)`);
  if (!Number.isFinite(pars.height))
    throw new Error(`invalid image height: ${pars.height} (in cm)`);
  validateImage(pars);
  if (pars.thumbnail) validateImage(pars.thumbnail);
}

const processImage = (ctx: Context, imagePars: ImagePars) => {
  validateImagePars(imagePars);
  const cx = (imagePars.width * 360e3).toFixed(0);
  const cy = (imagePars.height * 360e3).toFixed(0);

  let imgRelId = imageToContext(ctx, getImageData(imagePars));
  const id = String(ctx.imageAndShapeIdIncrement);
  const alt = imagePars.alt || '';
  const node = newNonTextNode;

  const extNodes = [];
  extNodes.push(
    node('a:ext', { uri: '{28A0092B-C50C-407E-A947-70E740481C1C}' }, [
      node('a14:useLocalDpi', {
        'xmlns:a14': 'http://schemas.microsoft.com/office/drawing/2010/main',
        val: '0',
      }),
    ])
  );

  // http://officeopenxml.com/drwSp-rotate.php
  // Values are in 60,000ths of a degree, with positive angles moving clockwise or towards the positive y-axis.
  const rot = imagePars.rotation
    ? (imagePars.rotation * 60e3).toString()
    : undefined;

  if (ctx.images[imgRelId].extension === '.svg') {
    // Default to an empty thumbnail, as it is not critical and just part of the docx standard's scaffolding.
    // Without a thumbnail, the svg won't render (even in newer versions of Word that don't need the thumbnail).
    const thumbnail: Image = imagePars.thumbnail ?? {
      data: 'bm90aGluZwo=',
      extension: '.png',
    };

    const thumbRelId = imageToContext(ctx, thumbnail);
    extNodes.push(
      node('a:ext', { uri: '{96DAC541-7B7A-43D3-8B79-37D633B846F1}' }, [
        node('asvg:svgBlip', {
          'xmlns:asvg':
            'http://schemas.microsoft.com/office/drawing/2016/SVG/main',
          'r:embed': imgRelId,
        }),
      ])
    );

    // For SVG the thumb is placed where the image normally goes.
    imgRelId = thumbRelId;
  }

  const pic = node(
    'pic:pic',
    { 'xmlns:pic': 'http://schemas.openxmlformats.org/drawingml/2006/picture' },
    [
      node('pic:nvPicPr', {}, [
        node('pic:cNvPr', { id: '0', name: `Picture ${id}`, descr: alt }),
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
        node('a:xfrm', rot ? { rot } : {}, [
          node('a:off', { x: '0', y: '0' }),
          node('a:ext', { cx, cy }),
        ]),
        node('a:prstGeom', { prst: 'rect' }, [node('a:avLst')]),
        node('a:noFill'),
        node('a:ln', {}, [node('a:noFill')]),
      ]),
    ]
  );
  const drawing = node('w:drawing', {}, [
    node('wp:inline', { distT: '0', distB: '0', distL: '0', distR: '0' }, [
      node('wp:extent', { cx, cy }),
      node('wp:docPr', { id, name: `Picture ${id}`, descr: alt }),
      node('wp:cNvGraphicFramePr', {}, [
        node('a:graphicFrameLocks', {
          'xmlns:a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
          noChangeAspect: '1',
        }),
      ]),
      node(
        'a:graphic',
        { 'xmlns:a': 'http://schemas.openxmlformats.org/drawingml/2006/main' },
        [
          node(
            'a:graphicData',
            { uri: 'http://schemas.openxmlformats.org/drawingml/2006/picture' },
            [pic]
          ),
        ]
      ),
    ]),
  ]);
  ctx.pendingImageNode = { image: drawing };
  if (imagePars.caption) {
    ctx.pendingImageNode.caption = [
      node('w:br'),
      node('w:t', {}, [newTextNode(imagePars.caption)]),
    ];
  }
};

function getImageData(imagePars: ImagePars): Image {
  const { data, extension } = imagePars;
  if (!extension) {
    throw new Error(
      'If you return image `data`, make sure you return an extension as well!'
    );
  }
  return { extension, data };
}

const processLink = async (ctx: Context, linkPars: LinkPars) => {
  const { url, label = url } = linkPars;
  ctx.linkId += 1;
  const id = String(ctx.linkId);
  const relId = `link${id}`;
  ctx.links[relId] = { url };
  const node = newNonTextNode;
  const { textRunPropsNode } = ctx;
  const link = node('w:hyperlink', { 'r:id': relId, 'w:history': '1' }, [
    node('w:r', {}, [
      textRunPropsNode ||
        node('w:rPr', {}, [node('w:u', { 'w:val': 'single' })]),
      node('w:t', {}, [newTextNode(label)]),
    ]),
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
const BufferKeys = ['w:p', 'w:tr', 'w:tc'] as const;
const appendTextToTagBuffers = (
  text: string,
  ctx: Context,
  options: {
    fCmd?: boolean;
    fInsertedText?: boolean;
  }
) => {
  if (ctx.fSeekQuery) return;
  const { fCmd, fInsertedText } = options;
  const type = fCmd ? 'cmds' : 'text';
  BufferKeys.forEach(key => {
    const buf = ctx.buffers[key];
    buf[type] += text;
    if (fInsertedText) buf.fInsertedText = true;
  });
};

function updateID(newNode: NonTextNode, ctx: Context) {
  ctx.imageAndShapeIdIncrement += 1;
  const id = String(ctx.imageAndShapeIdIncrement);
  newNode._attrs = {
    ...newNode._attrs,
    id: `${id}`,
  };
}
