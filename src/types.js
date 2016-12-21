// @flow

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
