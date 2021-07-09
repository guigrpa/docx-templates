/// <reference types="node" />
import { UserOptions, Node, NonTextNode, CommandSummary } from './types';
import JSZip from 'jszip';
export declare function parseTemplate(template: Buffer): Promise<{
    jsTemplate: Node;
    mainDocument: string;
    zip: JSZip;
    contentTypes: NonTextNode;
}>;
/**
 * Create Report from docx template
 *
 * example:
 * ```js
 * const report = await createReport({
 *   template,
 *   data: query => graphqlServer.execute(query),
 *   additionalJsContext: {
 *     // all of these will be available to JS snippets in your template commands
 *     foo: 'bar',
 *     qrCode: async url => {
 *       // do stuff
 *     },
 *   },
 *   cmdDelimiter: '+++',
 *   literalXmlDelimiter: '||',
 *   processLineBreaks: true,
 *   noSandbox: false,
 * });
 * ```
 *
 * @param options Options for Report
 */
declare function createReport(options: UserOptions): Promise<Uint8Array>;
/**
 * For development and testing purposes. Don't use _probe if you don't know what you are doing
 */
declare function createReport(options: UserOptions, _probe: 'JS'): Promise<Node>;
/**
 * For development and testing purposes. Don't use _probe if you don't know what you are doing
 */
declare function createReport(options: UserOptions, _probe: 'XML'): Promise<string>;
/**
 * Lists all the commands in a docx template.
 *
 * example:
 * ```js
 * const template_buffer = fs.readFileSync('template.docx');
 * const commands = await listCommands(template_buffer, ['{', '}']);
 * // `commands` will contain something like:
 * [
 *    { raw: 'INS some_variable', code: 'some_variable', type: 'INS' },
 *    { raw: 'IMAGE svgImgFile()', code: 'svgImgFile()', type: 'IMAGE' },
 * ]
 * ```
 *
 * @param template the docx template as a Buffer-like object
 * @param delimiter the command delimiter (defaults to ['+++', '+++'])
 */
export declare function listCommands(template: Buffer, delimiter?: string | [string, string]): Promise<CommandSummary[]>;
/**
 * Extract metadata from a document, such as the number of pages or words.
 * @param template the docx template as a Buffer-like object
 */
export declare function getMetadata(template: Buffer): Promise<{
    pages: number | undefined;
    words: number | undefined;
    characters: number | undefined;
    lines: number | undefined;
    paragraphs: number | undefined;
    company: string | undefined;
    template: string | undefined;
    title: string | undefined;
    subject: string | undefined;
    creator: string | undefined;
    description: string | undefined;
    lastModifiedBy: string | undefined;
    revision: string | undefined;
    lastPrinted: string | undefined;
    created: string | undefined;
    modified: string | undefined;
    category: string | undefined;
}>;
export declare function readContentTypes(zip: JSZip): Promise<NonTextNode>;
export declare function getMainDoc(contentTypes: NonTextNode): string;
export default createReport;
