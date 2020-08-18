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
} from './types';
import {
  NullishCommandResultError,
  CommandSyntaxError,
  InternalError,
  InvalidCommandError,
  ImageError,
} from './errors';
import { logger } from './debug';

function newContext(options: CreateReportOptions): Context {
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
    imageId: 0,
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
      !parent._fTextNode && // Flow, don't complain
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
  options: CreateReportOptions
): Promise<ReportOutput> {
  return walkTemplate(data, template, options, processCmd);
}

export async function walkTemplate(
  data: ReportData | undefined,
  template: Node,
  options: CreateReportOptions,
  processor: CommandProcessor
): Promise<ReportOutput> {
  const out: Node = cloneNodeWithoutChildren(template);
  const ctx = newContext(options);
  let nodeIn: Node = template;
  let nodeOut: Node = out;
  let move;
  let deltaJump = 0;
  const errors: Error[] = [];

  while (true) {
    const curLoop = getCurLoop(ctx);
    let nextSibling;

    // =============================================
    // Move input node pointer
    // =============================================
    if (ctx.fJump) {
      if (!curLoop) throw new InternalError();
      const { refNode, refNodeLevel } = curLoop;
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
        //
        //   logger.debug(`Updated loop '${curLoop.varName}' refNode:`, {
        //     attach: cloneNodeForLogging(nodeIn),
        //   });
      }
      const nodeOutParent = nodeOut._parent;
      if (nodeOutParent == null) throw new InternalError();

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
        delete ctx.pendingImageNode;
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
        delete ctx.pendingLinkNode;
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
        delete ctx.pendingHtmlNode;
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

    // Node creation: DOWN | SIDE
    // --------------------------
    // Note that nodes are copied to the new tree, but that doesn't mean they will be kept.
    // In some cases, they will be removed later on; for example, when a paragraph only
    // contained a command -- it will be deleted.
    if (move === 'DOWN' || move === 'SIDE') {
      // Move nodeOut to point to the new node's parent
      if (move === 'SIDE') {
        if (nodeOut._parent == null) throw new InternalError();
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
        !parent._fTextNode &&
        parent._tag === 'w:t'
      ) {
        const result = await processText(data, nodeIn, ctx, processor);
        if (typeof result === 'string') {
          // TODO: use a discriminated union here instead of a type assertion to distinguish TextNodes from NonTextNodes.
          const newNodeAsTextNode: TextNode = newNode as TextNode;
          newNodeAsTextNode._text = result;
        } else {
          errors.push(...result);
        }
      }

      // Execute the move in the output tree
      nodeOut = newNode;
    }

    // Correct output tree level in case of a JUMP
    // -------------------------------------------
    if (move === 'JUMP') {
      while (deltaJump > 0) {
        if (nodeOut._parent == null) throw new InternalError();
        nodeOut = nodeOut._parent;
        deltaJump -= 1;
      }
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
  const cmd = getCommand(ctx.cmd, ctx.shorthands);
  ctx.cmd = ''; // flush the context
  logger.debug(`Processing cmd: ${cmd}`);
  try {
    const { cmdName, cmdRest } = splitCommand(cmd);

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
      processEndForIf(node, ctx, cmd, cmdName, cmdRest);

      // INS <expression>
    } else if (cmdName === 'INS') {
      if (!isLoopExploring(ctx)) {
        const result = await runUserJsAndGetRaw(data, cmdRest, ctx);
        if (result == null) {
          return '';
        }

        // If the `processLineBreaks` flag is set,
        // newlines are replaced with a `w:br` tag (protected by
        // the `literalXmlDelimiter` separators)
        let str = String(result);
        if (ctx.options.processLineBreaks) {
          const { literalXmlDelimiter } = ctx.options;
          str = str.replace(
            /\n/g,
            `${literalXmlDelimiter}<w:br/>${literalXmlDelimiter}`
          );
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
            await processImage(ctx, img);
          } catch (e) {
            throw new ImageError(e.message, cmd);
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
    if (ctx.options.errorHandler != null) {
      return ctx.options.errorHandler(err);
    }
    return err;
  }
};

const builtInRegexes = BUILT_IN_COMMANDS.map(word => new RegExp(`^${word}\\b`));

const notBuiltIns = (cmd: string) =>
  !builtInRegexes.some(r => r.test(cmd.toUpperCase()));

export function getCommand(
  command: string,
  shorthands: Context['shorthands']
): string {
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
  let forMatch;
  let varName;
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
      const shouldRun = !!(await runUserJsAndGetRaw(data, cmdRest, ctx));
      loopOver = shouldRun ? [1] : [];
    } else {
      if (!forMatch) throw new InvalidCommandError('Invalid FOR command', cmd);
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
): void => {
  const curLoop = getCurLoop(ctx);
  if (!curLoop) throw new InvalidCommandError('Invalid command', cmd);
  const isIf = cmdName === 'END-IF';

  // First time we visit an END-IF node, we assign it the arbitrary name
  // generated when the IF was processed
  if (isIf && !node._ifName) node._ifName = curLoop.varName;

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
};

const imageToContext = (ctx: Context, img: Image) => {
  if (!(typeof img.extension === 'string')) {
    throw new Error(
      'An extension (e.g. `.png`) needs to be provided when providing an image or a thumbnail.'
    );
  }
  ctx.imageId += 1;
  const id = String(ctx.imageId);
  const relId = `img${id}`;
  ctx.images[relId] = img;
  return relId;
};

const processImage = async (ctx: Context, imagePars: ImagePars) => {
  const cx = (imagePars.width * 360e3).toFixed(0);
  const cy = (imagePars.height * 360e3).toFixed(0);

  let imgRelId = imageToContext(ctx, getImageData(imagePars));
  const id = String(ctx.imageId);
  const alt = imagePars.alt || 'desc';
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
        node('a:xfrm', {}, [
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
  ctx.pendingImageNode = drawing;
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
const BufferKeys = ['w:p', 'w:tr'] as const;
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

const getNextItem = (items: any[], curIdx0: number) => {
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
