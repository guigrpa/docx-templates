// @flow

// ==========================================
// Docx nodes
// ==========================================
type BaseNode = {|
  _parent: ?Node,
  _children: Array<Node>,
  _ifName?: string
|};
export type TextNode = {
  ...BaseNode,
  _fTextNode: true,
  _text: string
};
export type NonTextNode = {
  ...BaseNode,
  _fTextNode: false,
  _tag: string,
  _attrs: Object
};
export type Node = TextNode | NonTextNode;

// ==========================================
// Report creator
// ==========================================
export type ReportData = any;
export type Query = string;
export type QueryResolver = (
  query: ?Query,
  queryVars: any
) => ReportData | Promise<ReportData>;

export type UserOptions = {|
  template: string, // path
  data?: ReportData | QueryResolver,
  queryVars?: any,
  output?: string,
  replaceImagesBase64?: boolean,
  replaceImages?: any,
  cmdDelimiter?: string,
  literalXmlDelimiter?: string,
  processLineBreaks?: boolean, // true by default
  noSandbox?: boolean,
  vm2Sandbox?: boolean | Object,
  additionalJsContext?: Object,
  _probe?: 'JS' | 'XML'
|};
export type UserOptionsInternal = {|
  ...UserOptions,
  template: ArrayBuffer // template contents
|};

export type CreateReportOptions = {|
  cmdDelimiter: string,
  literalXmlDelimiter: string,
  processLineBreaks: boolean,
  noSandbox: boolean,
  vm2Sandbox: boolean | Object,
  additionalJsContext: Object
|};

export type Context = {
  level: number,
  fCmd: boolean,
  cmd: string,
  fSeekQuery: boolean,
  query: ?Query,
  buffers: {
    'w:p': BufferStatus,
    'w:tr': BufferStatus
  },
  pendingImageNode: ?NonTextNode,
  imageId: number,
  images: Images,
  pendingLinkNode: ?NonTextNode,
  linkId: number,
  links: Links,
  pendingHtmlNode: ?TextNode,
  htmlId: number,
  htmls: Htmls,
  vars: { [name: string]: VarValue },
  loops: Array<LoopStatus>,
  fJump: boolean,
  shorthands: { [shorthand: string]: string },
  options: CreateReportOptions,
  jsSandbox?: ?Object
};

export type Images = { [id: string]: Image };
export type Image = {
  extension: string,
  data: ArrayBuffer | string
};
export type Links = { [id: string]: Link };
export type Link = { url: string };
export type Htmls = { [id: string]: string };

export type BufferStatus = {
  text: string,
  cmds: string,
  fInsertedText: boolean
};

export type VarValue = any;
export type LoopStatus = {
  refNode: Node,
  refNodeLevel: number,
  varName: string,
  loopOver: Array<VarValue>,
  idx: number,
  isIf?: boolean
};

export type ImagePars = {
  width: number, // cm
  height: number, // cm
  path?: string, // only supported in Node
  data?: ArrayBuffer | string, // supported in Node and the browser
  extension?: string
};

export type LinkPars = {
  url: string,
  label?: string
};
