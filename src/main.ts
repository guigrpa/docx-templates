import { merge } from 'timm';
import {
  zipLoad,
  zipGetText,
  zipSetText,
  zipSetBinary,
  zipSetBase64,
  zipSave,
} from './zip';
import { parseXml, buildXml } from './xml';
import preprocessTemplate from './preprocessTemplate';
import {
  extractQuery,
  produceJsReport,
  walkTemplate,
  getCommand,
  splitCommand,
  newContext,
  findHighestImgId,
} from './processTemplate';
import {
  UserOptions,
  Htmls,
  CreateReportOptions,
  Images,
  Links,
  Node,
  NonTextNode,
  CommandSummary,
  BuiltInCommand,
} from './types';
import { addChild, newNonTextNode } from './reportUtils';
import JSZip from 'jszip';
import { TemplateParseError } from './errors';
import { logger } from './debug';

const DEFAULT_CMD_DELIMITER = '+++' as const;
const DEFAULT_LITERAL_XML_DELIMITER = '||' as const;
const CONTENT_TYPES_PATH = '[Content_Types].xml' as const;
const TEMPLATE_PATH = 'word' as const;
const XML_FILE_REGEX = new RegExp(`${TEMPLATE_PATH}\\/[^\\/]+\\.xml`);

export async function parseTemplate(template: Buffer) {
  logger.debug('Unzipping...');
  const zip = await zipLoad(template);

  // Read the 'document.xml' file (the template) and parse it
  logger.debug('finding main template file (e.g. document.xml)');
  // See issue #131. Office365 files may name the main template file document2.xml or something else
  // So we'll have to parse the content-types 'manifest' file first and retrieve the template file's name first.
  const contentTypes = await readContentTypes(zip);
  const mainDocument = getMainDoc(contentTypes);

  logger.debug('Reading template...');
  const templateXml = await zipGetText(zip, `${TEMPLATE_PATH}/${mainDocument}`);
  if (templateXml == null)
    throw new TemplateParseError(`${mainDocument} could not be found`);
  logger.debug(`Template file length: ${templateXml.length}`);
  logger.debug('Parsing XML...');
  const tic = new Date().getTime();
  const parseResult = await parseXml(templateXml);
  const jsTemplate = parseResult;
  const tac = new Date().getTime();

  logger.debug(`File parsed in ${tac - tic} ms`, {
    attach: jsTemplate,
    attachLevel: 'trace',
  });

  return { jsTemplate, mainDocument, zip, contentTypes };
}

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
async function createReport(options: UserOptions): Promise<Uint8Array>;
/**
 * For development and testing purposes. Don't use _probe if you don't know what you are doing
 */
async function createReport(options: UserOptions, _probe: 'JS'): Promise<Node>;

/**
 * For development and testing purposes. Don't use _probe if you don't know what you are doing
 */
async function createReport(
  options: UserOptions,
  _probe: 'XML'
): Promise<string>;
async function createReport(
  options: UserOptions,
  _probe?: 'JS' | 'XML'
): Promise<Node | string | Uint8Array> {
  logger.debug('Report options:', { attach: options });
  const { template, data, queryVars } = options;
  const literalXmlDelimiter =
    options.literalXmlDelimiter || DEFAULT_LITERAL_XML_DELIMITER;
  const createOptions: CreateReportOptions = {
    cmdDelimiter: getCmdDelimiter(options.cmdDelimiter),
    literalXmlDelimiter,
    processLineBreaks:
      options.processLineBreaks != null ? options.processLineBreaks : true,
    noSandbox: options.noSandbox || false,
    runJs: options.runJs,
    additionalJsContext: options.additionalJsContext || {},
    failFast: options.failFast == null ? true : options.failFast,
    rejectNullish:
      options.rejectNullish == null ? false : options.rejectNullish,
    errorHandler:
      typeof options.errorHandler === 'function' ? options.errorHandler : null,
    fixSmartQuotes:
      options.fixSmartQuotes == null ? false : options.fixSmartQuotes,
  };
  const xmlOptions = { literalXmlDelimiter };

  const { jsTemplate, mainDocument, zip, contentTypes } = await parseTemplate(
    template
  );

  logger.debug('Preprocessing template...');
  const prepped_template = preprocessTemplate(
    jsTemplate,
    createOptions.cmdDelimiter
  );

  // Fetch the data that will fill in the template
  let queryResult = null;
  if (typeof data === 'function') {
    logger.debug('Looking for the query in the template...');
    const query = await extractQuery(prepped_template, createOptions);
    logger.debug(`Query: ${query || 'no query found'}`);
    queryResult = await data(query, queryVars);
  } else {
    queryResult = data;
  }

  // Find all other XML files (headers, footers, etc)
  const secondary_xml_files: string[] = [];
  zip.forEach(async filePath => {
    if (
      XML_FILE_REGEX.test(filePath) &&
      filePath !== `${TEMPLATE_PATH}/${mainDocument}` &&
      filePath.indexOf(`${TEMPLATE_PATH}/template`) !== 0
    ) {
      secondary_xml_files.push(filePath);
    }
  });

  const prepped_secondaries: [Node, string][] = [];
  for (const f of secondary_xml_files) {
    const raw = await zipGetText(zip, f);
    if (raw == null) throw new TemplateParseError(`${f} could not be read`);
    const js0 = await parseXml(raw);
    const js = preprocessTemplate(js0, createOptions.cmdDelimiter);
    prepped_secondaries.push([js, f]);
  }

  // Find the highest image IDs by scanning the main document and all secondary XMLs.
  const highest_img_id = Math.max(
    ...prepped_secondaries.map(([s, _]) => findHighestImgId(s)),
    findHighestImgId(prepped_template)
  );

  // Process document.xml:
  // - Generate the report
  // - Build output XML and write it to disk
  // - Images
  logger.debug('Generating report...');
  let ctx = newContext(createOptions, highest_img_id);
  const result = await produceJsReport(queryResult, prepped_template, ctx);
  if (result.status === 'errors') {
    throw result.errors;
  }
  const {
    report: report1,
    images: images1,
    links: links1,
    htmls: htmls1,
  } = result;
  if (_probe === 'JS') return report1;

  logger.debug('Converting report to XML...');
  const reportXml = buildXml(report1, xmlOptions);
  if (_probe === 'XML') return reportXml;
  logger.debug('Writing report...');
  zipSetText(zip, `${TEMPLATE_PATH}/${mainDocument}`, reportXml);

  let numImages = Object.keys(images1).length;
  let numHtmls = Object.keys(htmls1).length;
  await processImages(images1, mainDocument, zip, TEMPLATE_PATH);
  await processLinks(links1, mainDocument, zip, TEMPLATE_PATH);
  await processHtmls(htmls1, mainDocument, zip, TEMPLATE_PATH);

  for (const [js, filePath] of prepped_secondaries) {
    // Grab the last used (highest) image id from the main document's context, but create
    // a fresh one for each secondary XML.
    ctx = newContext(createOptions, ctx.imageId);
    const result = await produceJsReport(queryResult, js, ctx);
    if (result.status === 'errors') {
      throw result.errors;
    }
    const {
      report: report2,
      images: images2,
      links: links2,
      htmls: htmls2,
    } = result;
    const xml = buildXml(report2, xmlOptions);
    zipSetText(zip, filePath, xml);

    numImages += Object.keys(images2).length;
    numHtmls += Object.keys(htmls2).length;

    const segments = filePath.split('/');
    const documentComponent = segments[segments.length - 1];
    await processImages(images2, documentComponent, zip, TEMPLATE_PATH);
    await processLinks(links2, mainDocument, zip, TEMPLATE_PATH);
    await processHtmls(htmls2, mainDocument, zip, TEMPLATE_PATH);
  }

  // Process [Content_Types].xml
  if (numImages || numHtmls) {
    logger.debug('Completing [Content_Types].xml...');

    // logger.debug('Content types', { attach: contentTypes });
    const ensureContentType = (extension: string, contentType: string) => {
      const children = contentTypes._children;
      if (
        children.filter(o => !o._fTextNode && o._attrs.Extension === extension)
          .length
      ) {
        return;
      }
      addChild(
        contentTypes,
        newNonTextNode('Default', {
          Extension: extension,
          ContentType: contentType,
        })
      );
    };
    if (numImages) {
      logger.debug('Completing [Content_Types].xml for IMAGES...');
      ensureContentType('png', 'image/png');
      ensureContentType('jpg', 'image/jpeg');
      ensureContentType('jpeg', 'image/jpeg');
      ensureContentType('gif', 'image/gif');
      ensureContentType('bmp', 'image/bmp');
      ensureContentType('svg', 'image/svg+xml');
    }
    if (numHtmls) {
      logger.debug('Completing [Content_Types].xml for HTML...');
      ensureContentType('html', 'text/html');
    }
    const finalContentTypesXml = buildXml(contentTypes, xmlOptions);
    zipSetText(zip, CONTENT_TYPES_PATH, finalContentTypesXml);
  }

  logger.debug('Zipping...');
  const output = await zipSave(zip);
  return output;
}

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
export async function listCommands(
  template: Buffer,
  delimiter?: string | [string, string]
): Promise<CommandSummary[]> {
  const opts: CreateReportOptions = {
    cmdDelimiter: getCmdDelimiter(delimiter),

    // Otherwise unused but mandatory options
    literalXmlDelimiter: DEFAULT_LITERAL_XML_DELIMITER,
    processLineBreaks: true,
    noSandbox: false,
    additionalJsContext: {},
    failFast: false,
    rejectNullish: false,
    errorHandler: null,
    fixSmartQuotes: false,
  };

  const { jsTemplate } = await parseTemplate(template);

  logger.debug('Preprocessing template...');
  const prepped = preprocessTemplate(jsTemplate, opts.cmdDelimiter);

  const commands: CommandSummary[] = [];
  const ctx = newContext(opts);
  await walkTemplate(undefined, prepped, ctx, async (data, node, ctx) => {
    const raw = getCommand(ctx.cmd, ctx.shorthands, ctx.options.fixSmartQuotes);
    ctx.cmd = ''; // flush the context
    const { cmdName, cmdRest: code } = splitCommand(raw);
    const type = cmdName as BuiltInCommand;
    if (type != null && type !== 'CMD_NODE') {
      commands.push({
        raw,
        type,
        code,
      });
    }
    return undefined;
  });

  return commands;
}

/**
 * Extract metadata from a document, such as the number of pages or words.
 * @param template the docx template as a Buffer-like object
 */
export async function getMetadata(template: Buffer) {
  const app_xml_path = `docProps/app.xml`;
  const core_xml_path = `docProps/core.xml`;
  const zip = await zipLoad(template);
  const appXml = await parsePath(zip, app_xml_path);
  const coreXml = await parsePath(zip, core_xml_path);
  // TODO: extract custom.xml as well?

  function getText(t: Node): string | undefined {
    if (t._children.length === 0) return undefined;
    const n = t._children[0];
    if (n._fTextNode) return n._text;
    throw new Error(`Not a text node`);
  }

  function findNodeText(m: Node, tag: string): string | undefined {
    for (const t of m._children) {
      if (t._fTextNode) continue;
      if (t._tag === tag) return getText(t);
    }
    return;
  }

  const numberize = (a: any): number | undefined => {
    const c = Number(a);
    if (Number.isFinite(c)) return c;
    return;
  };

  return {
    pages: numberize(findNodeText(appXml, 'Pages')),
    words: numberize(findNodeText(appXml, 'Words')),
    characters: numberize(findNodeText(appXml, 'Characters')),
    lines: numberize(findNodeText(appXml, 'Lines')),
    paragraphs: numberize(findNodeText(appXml, 'Paragraphs')),
    company: findNodeText(appXml, 'Company'),
    template: findNodeText(appXml, 'Template'),

    // from CoreXML
    title: findNodeText(coreXml, 'dc:title'),
    subject: findNodeText(coreXml, 'dc:subject'),
    creator: findNodeText(coreXml, 'dc:creator'),
    description: findNodeText(coreXml, 'dc:description'),
    lastModifiedBy: findNodeText(coreXml, 'cp:lastModifiedBy'),
    revision: findNodeText(coreXml, 'cp:revision'),
    lastPrinted: findNodeText(coreXml, 'cp:lastPrinted'),
    created: findNodeText(coreXml, 'dcterms:created'),
    modified: findNodeText(coreXml, 'dcterms:modified'),
    category: findNodeText(coreXml, 'cp:category'),
  };
}

async function parsePath(zip: JSZip, xml_path: string): Promise<NonTextNode> {
  const xmlFile = await zipGetText(zip, xml_path);
  if (xmlFile == null)
    throw new TemplateParseError(`${xml_path} could not be read`);
  const node = await parseXml(xmlFile);
  if (node._fTextNode)
    throw new TemplateParseError(`${xml_path} is a text node when parsed`);
  return node;
}

export async function readContentTypes(zip: JSZip): Promise<NonTextNode> {
  return await parsePath(zip, CONTENT_TYPES_PATH);
}

export function getMainDoc(contentTypes: NonTextNode): string {
  const MAIN_DOC_MIMES = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml',
    'application/vnd.ms-word.document.macroEnabled.main+xml',
  ];
  for (const t of contentTypes._children) {
    if (!t._fTextNode) {
      if (
        t._attrs.ContentType != null &&
        MAIN_DOC_MIMES.includes(t._attrs.ContentType)
      ) {
        const path = t._attrs.PartName;
        if (path) {
          return path.replace('/word/', '');
        }
      }
    }
  }
  throw new TemplateParseError(
    `Could not find main document (e.g. document.xml) in ${CONTENT_TYPES_PATH}`
  );
}

const processImages = async (
  images: Images,
  documentComponent: string,
  zip: JSZip,
  templatePath: string
) => {
  logger.debug(`Processing images for ${documentComponent}...`);
  const imageIds = Object.keys(images);
  if (imageIds.length) {
    logger.debug('Completing document.xml.rels...');
    const relsPath = `${templatePath}/_rels/${documentComponent}.rels`;
    const rels = await getRelsFromZip(zip, relsPath);
    for (let i = 0; i < imageIds.length; i++) {
      const imageId = imageIds[i];
      const { extension, data: imgData } = images[imageId];
      const imgName = `template_${documentComponent}_image${i + 1}${extension}`;
      logger.debug(`Writing image ${imageId} (${imgName})...`);
      const imgPath = `${templatePath}/media/${imgName}`;
      if (typeof imgData === 'string') {
        zipSetBase64(zip, imgPath, imgData);
      } else {
        zipSetBinary(zip, imgPath, imgData);
      }
      addChild(
        rels,
        newNonTextNode('Relationship', {
          Id: imageId,
          Type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
          Target: `media/${imgName}`,
        })
      );
    }
    const finalRelsXml = buildXml(rels, {
      literalXmlDelimiter: DEFAULT_LITERAL_XML_DELIMITER,
    });
    zipSetText(zip, relsPath, finalRelsXml);
  }
};

const processLinks = async (
  links: Links,
  documentComponent: string,
  zip: JSZip,
  templatePath: string
) => {
  logger.debug(`Processing links for ${documentComponent}...`);
  const linkIds = Object.keys(links);
  if (linkIds.length) {
    logger.debug('Completing document.xml.rels...');
    const relsPath = `${templatePath}/_rels/${documentComponent}.rels`;
    const rels = await getRelsFromZip(zip, relsPath);
    for (const linkId of linkIds) {
      const { url } = links[linkId];
      addChild(
        rels,
        newNonTextNode('Relationship', {
          Id: linkId,
          Type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink',
          Target: url,
          TargetMode: 'External',
        })
      );
    }
    const finalRelsXml = buildXml(rels, {
      literalXmlDelimiter: DEFAULT_LITERAL_XML_DELIMITER,
    });
    zipSetText(zip, relsPath, finalRelsXml);
  }
};

const processHtmls = async (
  htmls: Htmls,
  documentComponent: string,
  zip: JSZip,
  templatePath: string
) => {
  logger.debug(`Processing htmls for ${documentComponent}...`);
  const htmlIds = Object.keys(htmls);
  if (htmlIds.length) {
    // Process rels
    logger.debug(`Completing document.xml.rels...`);
    const htmlFiles = [];
    const relsPath = `${templatePath}/_rels/${documentComponent}.rels`;
    const rels = await getRelsFromZip(zip, relsPath);
    for (const htmlId of htmlIds) {
      const htmlData = htmls[htmlId];
      const htmlName = `template_${documentComponent.replace('.', '_')}_${htmlId}.html`;
      logger.debug(`Writing html ${htmlId} (${htmlName})...`);
      const htmlPath = `${templatePath}/${htmlName}`;
      htmlFiles.push(`/${htmlPath}`);
      zipSetText(zip, htmlPath, htmlData);
      addChild(
        rels,
        newNonTextNode('Relationship', {
          Id: htmlId,
          Type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/aFChunk',
          Target: `${htmlName}`,
        })
      );
    }
    const finalRelsXml = buildXml(rels, {
      literalXmlDelimiter: DEFAULT_LITERAL_XML_DELIMITER,
    });
    zipSetText(zip, relsPath, finalRelsXml);
  }
};

const getRelsFromZip = async (zip: JSZip, relsPath: string) => {
  let relsXml = await zipGetText(zip, relsPath);
  if (!relsXml) {
    relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        </Relationships>`;
  }
  return parseXml(relsXml);
};

const getCmdDelimiter = (
  delimiter?: string | [string, string]
): [string, string] => {
  if (!delimiter) return [DEFAULT_CMD_DELIMITER, DEFAULT_CMD_DELIMITER];
  if (typeof delimiter === 'string') return [delimiter, delimiter];
  return delimiter;
};

export default createReport;
