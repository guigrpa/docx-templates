// @flow

// ==========================================
// Docx nodes
// ==========================================
type BaseNode = {
  _parent: ?Node,
  _children: Array<Node>,
};
export type TextNode = BaseNode & {
  _fTextNode: true,
  _text: string,
};
export type NonTextNode = BaseNode & {
  _fTextNode: false,
  _tag: string,
  _attrs: Object,
};
export type Node = TextNode | NonTextNode;

// ==========================================
// Report creator
// ==========================================
export type ReportData = any;
export type Query = string;
export type QueryResolver = (query: ?Query, queryVars: any) => ReportData | Promise<ReportData>;
export type UserOptions = {|
  template: string,
  data?: ReportData | QueryResolver,
  queryVars?: any,
  output?: string,
  images?: JSON,
  cmdDelimiter?: string,
  literalXmlDelimiter?: string,
  processLineBreaks?: boolean,
  _probe?: 'JS' | 'XML',
|};

export type CreateReportOptions = {|
  cmdDelimiter: string,
  literalXmlDelimiter: string,
  processLineBreaks: boolean,
|};

export type Context = {
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
  jsSandbox?: ?Object,
};

export type BufferStatus = {
  text: string,
  cmds: string,
  fInsertedText: boolean,
};

export type VarValue = any;
export type LoopStatus = {
  refNode: Node,
  refNodeLevel: number,
  varName: string,
  loopOver: Array<VarValue>,
  idx: number,
};
