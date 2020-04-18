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
  template: Buffer;
  data?: ReportData | QueryResolver;
  queryVars?: any;
  cmdDelimiter?: string | [string, string];
  literalXmlDelimiter?: string;
  processLineBreaks?: boolean; // true by default
  noSandbox?: boolean;
  runJs?: RunJSFunc;
  additionalJsContext?: Object;
  failFast?: boolean;
};

export type CreateReportOptions = {
  cmdDelimiter: [string, string];
  literalXmlDelimiter: string;
  processLineBreaks: boolean;
  noSandbox: boolean;
  runJs?: RunJSFunc;
  additionalJsContext: Object;
  failFast: boolean;
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
