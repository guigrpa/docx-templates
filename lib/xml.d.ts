import { Node } from './types';
declare const parseXml: (templateXml: string) => Promise<Node>;
declare type XmlOptions = {
    literalXmlDelimiter: string;
};
declare const buildXml: (node: Node, options: XmlOptions, indent?: string) => string;
export { parseXml, buildXml };
