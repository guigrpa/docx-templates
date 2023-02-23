// ==========================================
// Docx nodes

import { QualifiedAttribute } from 'sax';

// ==========================================
export type Node = TextNode | NonTextNode;
type BaseNode = {
  _parent?: Node;
  _children: Array<Node>;
  _ifName?: string;
};
export type TextNode = BaseNode & {
  _fTextNode: true;
  _text: string;
};
export type NonTextNode = BaseNode & {
  _fTextNode: false;
  _tag: string;

  // Simplified; only need this property
  _attrs: { [key: string]: QualifiedAttribute | string } & {
    Extension?: string;
    ContentType?: string;
    PartName?: string;
  };
};

// ==========================================
// Report creator
// ==========================================
export type ReportData = any;
export type QueryResolver = (
  query: string | undefined,
  queryVars: any
) => ReportData | Promise<ReportData>;

type ErrorHandler = (e: Error, raw_code?: string) => any;

type RunJSFunc = (o: { sandbox: Object; ctx: Object }) => {
  modifiedSandbox: Object;
  result: any;
};

export type UserOptions = {
  /**
   * Docx file template as a NodeJS Buffer or Buffer-like object in Browsers.
   */
  template: Buffer;
  /**
   * Object of data to be injected or a (async) function that resolves to the data. The function gets as an argument the contents of the QUERY command as a string.
   */
  data?: ReportData | QueryResolver;
  /**
   * Gets injected into data function as second argument.
   */
  queryVars?: any;
  /**
   * Defines a custom command delimiter. This can be a String e.g. '+++' or an Array of Strings with length 2: ['{', '}'] in which the first element serves as the start delimiter and the second as the end delimiter.
   */
  cmdDelimiter?: string | [string, string];
  /**
   * The delimiter that's used to indicate literal XML that should be inserted into the docx XML tree as-is. Defaults to `||`.
   */
  literalXmlDelimiter?: string;
  /**
   * Handle linebreaks in result of commands as actual linebreaks (Default: true)
   */
  processLineBreaks?: boolean; // true by default
  /**
   * INSECURE: Set this option to true to disable running all commands in a new JS-VM. USE ONLY WITH TRUSTED TEMPLATES. Beware of arbitrary code injection risks. Can slightly improve performance on complex templates.
   */
  noSandbox?: boolean;
  /**
   * Custom sandbox. See documentation for details.
   */
  runJs?: RunJSFunc;
  /**
   * Add functions or other static data to this option to have access to it in your commands.
   *
   * ```js
   * additionalJsContext: {
   *   qrCode: url => {
   *     const dataUrl = createQrImage(url, { size: 500 });
   *     const data = dataUrl.slice('data:image/gif;base64,'.length);
   *     return { width: 6, height: 6, data, extension: '.gif' };
   *   },
   * }
   * ```
   */
  additionalJsContext?: Object;
  /**
   * Whether to fail on the first error encountered in the template. Defaults to true. Can be used to collect all errors in a template (e.g. misspelled commands) before failing.
   */
  failFast?: boolean;

  /**
   * When set to `true`, this setting ensures `createReport` throws a `NullishCommandResultError` when the result of an INS, HTML, IMAGE, or LINK command is `null` or `undefined`. This is useful as nullish return values usually indicate a mistake in the template or the invoking code. Defaults to `false`.
   */
  rejectNullish?: boolean;

  /**
   * Custom error handler to catch any errors that may occur evaluating commands in the template. The value returned from this handler will be inserted into the template instead.
   */
  errorHandler?: ErrorHandler;

  /**
   * MS Word usually autocorrects JS string literal quotes with unicode 'smart' quotes ('curly' quotes). E.g. 'aubergine' -> ‘aubergine’.
   * This causes an error when evaluating commands containing these smart quotes, as they are not valid JavaScript.
   * If you set fixSmartQuotes to 'true', these smart quotes will automatically get replaced with straight quotes (') before command evaluation.
   * Defaults to false.
   */
  fixSmartQuotes?: boolean;

  /**
   * Use the new way of injecting line breaks from command results (only applies when `processLineBreaks` is `true`)
   * which has better results in LibreOffice and Google Drive.
   * (Default: false)
   */
  processLineBreaksAsNewText?: boolean;
};

export type CreateReportOptions = {
  cmdDelimiter: [string, string];
  literalXmlDelimiter: string;
  processLineBreaks: boolean;
  noSandbox: boolean;
  runJs?: RunJSFunc;
  additionalJsContext: Object;
  failFast: boolean;
  rejectNullish: boolean;
  errorHandler: ErrorHandler | null;
  fixSmartQuotes: boolean;
  processLineBreaksAsNewText: boolean;
};

export type Context = {
  gCntIf: number;
  level: number;
  fCmd: boolean;
  cmd: string;
  fSeekQuery: boolean;
  query?: string;
  buffers: {
    'w:p': BufferStatus;
    'w:tr': BufferStatus;
  };
  pendingImageNode?: { image: NonTextNode; caption?: NonTextNode[] };
  imageId: number;
  images: Images;
  pendingLinkNode?: NonTextNode;
  linkId: number;
  links: Links;
  pendingHtmlNode?: TextNode | NonTextNode;
  htmlId: number;
  htmls: Htmls;
  vars: { [name: string]: VarValue };
  loops: Array<LoopStatus>;
  fJump: boolean;
  shorthands: { [shorthand: string]: string };
  options: CreateReportOptions;
  jsSandbox?: Object;
  textRunPropsNode?: NonTextNode;
};

export type Images = { [id: string]: Image };
export const ImageExtensions = [
  '.png',
  '.gif',
  '.jpg',
  '.jpeg',
  '.svg',
] as const;
type ImageExtension = typeof ImageExtensions[number];
export type Image = {
  extension: ImageExtension;
  data: Buffer | ArrayBuffer | string;
};
export type Links = { [id: string]: Link };
type Link = { url: string };
export type Htmls = { [id: string]: string };

type BufferStatus = {
  text: string;
  cmds: string;
  fInsertedText: boolean;
};

type VarValue = unknown;
export type LoopStatus = {
  refNode: Node;
  refNodeLevel: number;
  varName: string;
  loopOver: Array<VarValue>;
  idx: number;
  isIf?: boolean;
};

export type ImagePars = {
  /**
   * Desired width of the image in centimeters.
   */
  width: number;

  /**
   * Desired height of the image in centimeters.
   */
  height: number;

  /**
   * Either an ArrayBuffer or a base64 string with the image data.
   */
  data: ArrayBuffer | string;

  /**
   * Optional. When injecting an SVG image, a fallback non-SVG (png/jpg/gif, etc.) image can be provided. This thumbnail is used when SVG images are not supported (e.g. older versions of Word) or when the document is previewed by e.g. Windows Explorer. See usage example below.
   */
  thumbnail?: Image;

  /**
   * One of '.png', '.gif', '.jpg', '.jpeg', '.svg'.
   */
  extension: ImageExtension;

  /**
   * Optional alt text.
   */
  alt?: string;

  /**
   * Optional rotation in degrees, with positive angles moving clockwise.
   */
  rotation?: number;

  /**
   * Optional caption
   */
  caption?: string;
};

export type LinkPars = {
  url: string;
  label?: string;
};

export type CommandSummary = {
  raw: string;
  type: BuiltInCommand;
  code: string;
};

export type BuiltInCommand = typeof BUILT_IN_COMMANDS[number];

export const BUILT_IN_COMMANDS = [
  'QUERY',
  'CMD_NODE',
  'ALIAS',
  'FOR',
  'END-FOR',
  'IF',
  'END-IF',
  'INS',
  'EXEC',
  'IMAGE',
  'LINK',
  'HTML',
] as const;
