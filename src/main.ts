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

async function parseTemplate(template: Buffer) {
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
  };
  const xmlOptions = { literalXmlDelimiter };

  const { jsTemplate, mainDocument, zip, contentTypes } = await parseTemplate(
    template
  );

  logger.debug('Preprocessing template...');
  const finalTemplate = preprocessTemplate(
    jsTemplate,
    createOptions.cmdDelimiter
  );

  // Fetch the data that will fill in the template
  let queryResult = null;
  if (typeof data === 'function') {
    logger.debug('Looking for the query in the template...');
    const query = await extractQuery(finalTemplate, createOptions);
    logger.debug(`Query: ${query || 'no query found'}`);
    queryResult = await data(query, queryVars);
  } else {
    queryResult = data;
  }

  // Process document.xml:
  // - Generate the report
  // - Build output XML and write it to disk
  // - Images
  logger.debug('Generating report...');
  const result = await produceJsReport(
    queryResult,
    finalTemplate,
    createOptions
  );
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

  // Process all other XML files (they may contain headers, etc.)
  const files: string[] = [];
  zip.forEach(async filePath => {
    const regex = new RegExp(`${TEMPLATE_PATH}\\/[^\\/]+\\.xml`);
    if (
      regex.test(filePath) &&
      filePath !== `${TEMPLATE_PATH}/${mainDocument}` &&
      filePath.indexOf(`${TEMPLATE_PATH}/template`) !== 0
    ) {
      files.push(filePath);
    }
  });

  let images = images1;
  let links = links1;
  let htmls = htmls1;
  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    logger.debug(`Processing ${filePath}...`);
    const raw = await zipGetText(zip, filePath);
    if (raw == null)
      throw new TemplateParseError(`${filePath} could not be read`);
    const js0 = await parseXml(raw);
    const js = preprocessTemplate(js0, createOptions.cmdDelimiter);
    const result = await produceJsReport(queryResult, js, createOptions);
    if (result.status === 'errors') {
      throw result.errors;
    }
    const {
      report: report2,
      images: images2,
      links: links2,
      htmls: htmls2,
    } = result;
    images = merge(images, images2) as Images;
    links = merge(links, links2) as Links;
    htmls = merge(htmls, htmls2) as Htmls;
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
  };

  const { jsTemplate } = await parseTemplate(template);

  logger.debug('Preprocessing template...');
  const prepped = preprocessTemplate(jsTemplate, opts.cmdDelimiter);

  const commands: CommandSummary[] = [];
  await walkTemplate(undefined, prepped, opts, async (data, node, ctx) => {
    const raw = getCommand(ctx.cmd, ctx.shorthands);
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

export async function readContentTypes(zip: JSZip): Promise<NonTextNode> {
  const contentTypesXml = await zipGetText(zip, CONTENT_TYPES_PATH);
  if (contentTypesXml == null)
    throw new TemplateParseError(`${CONTENT_TYPES_PATH} could not be read`);
  const node = await parseXml(contentTypesXml);
  if (node._fTextNode)
    throw new TemplateParseError(
      `${CONTENT_TYPES_PATH} is a text node when parsed`
    );
  return node;
}

export function getMainDoc(contentTypes: NonTextNode): string {
  const MAIN_DOC_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml' as const;
  for (const t of contentTypes._children) {
    if (!t._fTextNode) {
      if (t._attrs.ContentType === MAIN_DOC_MIME) {
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

// ==========================================
// Process images
// ==========================================
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
          Type:
            'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
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

// ==========================================
// Process links
// ==========================================
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
    for (let i = 0; i < linkIds.length; i++) {
      const linkId = linkIds[i];
      const { url } = links[linkId];
      addChild(
        rels,
        newNonTextNode('Relationship', {
          Id: linkId,
          Type:
            'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink',
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
    for (let i = 0; i < htmlIds.length; i++) {
      const htmlId = htmlIds[i];
      const htmlData = htmls[htmlId];
      const htmlName = `template_${documentComponent}_${htmlId}.html`;
      logger.debug(`Writing html ${htmlId} (${htmlName})...`);
      const htmlPath = `${templatePath}/${htmlName}`;
      htmlFiles.push(`/${htmlPath}`);
      zipSetText(zip, htmlPath, htmlData);
      addChild(
        rels,
        newNonTextNode('Relationship', {
          Id: htmlId,
          Type:
            'http://schemas.openxmlformats.org/officeDocument/2006/relationships/aFChunk',
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

// ==========================================
// Miscellaneous
// ==========================================
const getCmdDelimiter = (
  delimiter?: string | [string, string]
): [string, string] => {
  if (!delimiter) return [DEFAULT_CMD_DELIMITER, DEFAULT_CMD_DELIMITER];
  if (typeof delimiter === 'string') return [delimiter, delimiter];
  return delimiter;
};

export default createReport;
