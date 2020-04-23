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
  };
};

// ==========================================
// Report creator
// ==========================================
export type ReportData = any;
export type Query = string;
export type QueryResolver = (
  query: Query | undefined,
  queryVars: any
) => ReportData | Promise<ReportData>;

type RunJSFunc = (o: {
  sandbox: Object;
  ctx: Object;
}) => {
  modifiedSandbox: Object;
  result: any;
};

export type UserOptions = {
  /**
   * template as a NodeJS Buffer or Buffer-like object in Browsers
   */
  template: Buffer;
  /**
   * Object of data to be injected or a (async) function that resolves to the data. The function gets as a argument the contens of the QUERY command as a string.
   */
  data?: ReportData | QueryResolver;
  /**
   * Gets injected into data function as second argument.
   */
  queryVars?: any;
  /**
   * Define a custom command delimeter this can be a String e.g. '+++' or a Array of Strings with length 2: ['{', '}'] with first element as the start delimeter and the second as the end delimeter
   */
  cmdDelimiter?: string | [string, string];
  /**
   * Can be used to change the delimiter in generated XML. Use this only when the result of your commands contains ||.
   */
  literalXmlDelimiter?: string;
  /**
   * Handle linebreaks in result of commands as actual linebreaks (Default: true)
   */
  processLineBreaks?: boolean; // true by default
  /**
   * Template and data is SAVE and TRUSTED. Set this option to true to disable running all commands in a new JS-VM.
   */
  noSandbox?: boolean;
  /**
   * Custom sandbox see documentation for mor details
   */
  runJs?: RunJSFunc;
  /**
   * Add functions or other static data to this option to have access to it in your commands
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
};

export type CreateReportOptions = {
  cmdDelimiter: [string, string];
  literalXmlDelimiter: string;
  processLineBreaks: boolean;
  noSandbox: boolean;
  runJs?: RunJSFunc;
  additionalJsContext: Object;
};

export type Context = {
  level: number;
  fCmd: boolean;
  cmd: string;
  fSeekQuery: boolean;
  query?: Query;
  buffers: {
    'w:p': BufferStatus;
    'w:tr': BufferStatus;
  };
  pendingImageNode?: NonTextNode;
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
export type Image = {
  extension: string;
  data: ArrayBuffer | string;
};
export type Links = { [id: string]: Link };
export type Link = { url: string };
export type Htmls = { [id: string]: string };

export type BufferStatus = {
  text: string;
  cmds: string;
  fInsertedText: boolean;
};

export type VarValue = any;
export type LoopStatus = {
  refNode: Node;
  refNodeLevel: number;
  varName: string;
  loopOver: Array<VarValue>;
  idx: number;
  isIf?: boolean;
};

export type ImagePars = {
  width: number; // cm
  height: number; // cm
  data: ArrayBuffer | string;
  extension?: string;
  alt?: string; // optional alt text
};

export type LinkPars = {
  url: string;
  label?: string;
};
