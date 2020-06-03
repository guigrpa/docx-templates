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
import { extractQuery, produceJsReport } from './processTemplate';
import {
  UserOptions,
  Htmls,
  CreateReportOptions,
  Images,
  Links,
  Node,
} from './types';
import { addChild, newNonTextNode } from './reportUtils';
import log from './debug';
import JSZip from 'jszip';

const DEFAULT_CMD_DELIMITER = '+++';
const DEFAULT_LITERAL_XML_DELIMITER = '||';

// TODO: remove
const DEBUG = process.env.DEBUG_DOCX_TEMPLATES;

// ==========================================
// Main
// ==========================================
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
  DEBUG && log.debug('Report options:', { attach: options });
  const { template, data, queryVars } = options;
  const templatePath = 'word';
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
    postProcessor:
      options.postProcessor != null
        ? options.postProcessor
        : (root, filename) => {
            DEBUG &&
              log.debug(`Default Postprocessor: no changes to ${filename}`);
            return root;
          },
  };
  const xmlOptions = { literalXmlDelimiter };

  // ---------------------------------------------------------
  // Unzip
  // ---------------------------------------------------------
  DEBUG && log.debug('Unzipping...');
  const zip = await zipLoad(template);

  // ---------------------------------------------------------
  // Read the 'document.xml' file (the template) and parse it
  // ---------------------------------------------------------
  DEBUG && log.debug('Reading template...');
  const templateXml = await zipGetText(zip, `${templatePath}/document.xml`);
  if (templateXml == null) throw new Error('document.xml could not be found');
  DEBUG && log.debug(`Template file length: ${templateXml.length}`);
  DEBUG && log.debug('Parsing XML...');
  const tic = new Date().getTime();
  const parseResult = await parseXml(templateXml);
  const jsTemplate = parseResult;
  const tac = new Date().getTime();
  DEBUG &&
    log.debug(`File parsed in ${tac - tic} ms`, {
      attach: jsTemplate,
      attachLevel: 'trace',
    });

  // ---------------------------------------------------------
  // Preprocess template
  // ---------------------------------------------------------
  DEBUG && log.debug('Preprocessing template...');
  // DEBUG && log.debug('Preprocessing template...', {
  //   attach: jsTemplate,
  //   attachLevel: 'debug',
  //   ignoreKeys: ['_parent', '_fTextNode', '_attrs'],
  // });
  const finalTemplate = preprocessTemplate(jsTemplate, createOptions);

  // ---------------------------------------------------------
  // Fetch the data that will fill in the template
  // ---------------------------------------------------------
  let queryResult = null;
  if (typeof data === 'function') {
    DEBUG && log.debug('Looking for the query in the template...');
    const query = await extractQuery(finalTemplate, createOptions);
    DEBUG && log.debug(`Query: ${query || 'no query found'}`);
    queryResult = await data(query, queryVars);
  } else {
    queryResult = data;
  }

  // ---------------------------------------------------------
  // Process document.xml:
  // - Generate the report
  // - Build output XML and write it to disk
  // - Images
  // ---------------------------------------------------------
  DEBUG && log.debug('Generating report...');
  // DEBUG &&
  //   log.debug('Generating report...', {
  //     attach: finalTemplate,
  //     attachLevel: 'debug',
  //     ignoreKeys: ['_parent', '_fTextNode', '_attrs'],
  //   });
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

  // DEBUG &&
  //   log.debug('Report', {
  //     attach: report,
  //     attachLevel: 'debug',
  //     ignoreKeys: ['_parent', '_fTextNode', '_attrs'],
  //   });

  DEBUG && log.debug(`postProcessing document.xml`);
  const report1b = createOptions.postProcessor(
    report1,
    `${templatePath}/document.xml`
  );

  DEBUG && log.debug('Converting report to XML...');
  const reportXml = buildXml(report1b, xmlOptions);
  if (_probe === 'XML') return reportXml;
  DEBUG && log.debug('Writing report...');
  zipSetText(zip, `${templatePath}/document.xml`, reportXml);

  let numImages = Object.keys(images1).length;
  let numHtmls = Object.keys(htmls1).length;
  await processImages(images1, 'document.xml', zip, templatePath);
  await processLinks(links1, 'document.xml', zip, templatePath);
  await processHtmls(htmls1, 'document.xml', zip, templatePath);

  // ---------------------------------------------------------
  // Process all other XML files (they may contain headers, etc.)
  // ---------------------------------------------------------
  const files: string[] = [];
  zip.forEach(async filePath => {
    const regex = new RegExp(`${templatePath}\\/[^\\/]+\\.xml`);
    if (
      regex.test(filePath) &&
      filePath !== `${templatePath}/document.xml` &&
      filePath.indexOf(`${templatePath}/template`) !== 0
    ) {
      files.push(filePath);
    }
  });

  let images = images1;
  let links = links1;
  let htmls = htmls1;
  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    DEBUG && log.info(`Processing ${filePath}...`);
    const raw = await zipGetText(zip, filePath);
    if (raw == null) throw new Error(`${filePath} could not be read`);
    const js0 = await parseXml(raw);
    const js = preprocessTemplate(js0, createOptions);
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

    DEBUG && log.debug(`postProcessing ${filePath}`);
    const report2b = createOptions.postProcessor(report2, `${filePath}`);

    const xml = buildXml(report2b, xmlOptions);
    zipSetText(zip, filePath, xml);

    numImages += Object.keys(images2).length;
    numHtmls += Object.keys(htmls2).length;

    const segments = filePath.split('/');
    const documentComponent = segments[segments.length - 1];
    await processImages(images2, documentComponent, zip, templatePath);
    await processLinks(links2, 'document.xml', zip, templatePath);
    await processHtmls(htmls2, 'document.xml', zip, templatePath);
  }

  // ---------------------------------------------------------
  // Process [Content_Types].xml
  // ---------------------------------------------------------
  if (numImages || numHtmls) {
    DEBUG && log.debug('Completing [Content_Types].xml...');
    const contentTypesPath = '[Content_Types].xml';
    const contentTypesXml = await zipGetText(zip, contentTypesPath);
    if (contentTypesXml == null)
      throw new Error(`${contentTypesPath} could not be read`);
    const contentTypes = await parseXml(contentTypesXml);
    // DEBUG && log.debug('Content types', { attach: contentTypes });
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
      DEBUG && log.debug('Completing [Content_Types].xml for IMAGES...');
      ensureContentType('png', 'image/png');
      ensureContentType('jpg', 'image/jpeg');
      ensureContentType('jpeg', 'image/jpeg');
      ensureContentType('gif', 'image/gif');
      ensureContentType('bmp', 'image/bmp');
      ensureContentType('svg', 'image/svg+xml');
    }
    if (numHtmls) {
      DEBUG && log.debug('Completing [Content_Types].xml for HTML...');
      ensureContentType('html', 'text/html');
    }
    const finalContentTypesXml = buildXml(contentTypes, xmlOptions);
    zipSetText(zip, contentTypesPath, finalContentTypesXml);
  }

  // ---------------------------------------------------------
  // Zip the results
  // ---------------------------------------------------------
  DEBUG && log.debug('Zipping...');
  const output = await zipSave(zip);
  return output;
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
  DEBUG && log.debug(`Processing images for ${documentComponent}...`);
  const imageIds = Object.keys(images);
  if (imageIds.length) {
    DEBUG && log.debug('Completing document.xml.rels...');
    const relsPath = `${templatePath}/_rels/${documentComponent}.rels`;
    const rels = await getRelsFromZip(zip, relsPath);
    for (let i = 0; i < imageIds.length; i++) {
      const imageId = imageIds[i];
      const { extension, data: imgData } = images[imageId];
      const imgName = `template_${documentComponent}_image${i + 1}${extension}`;
      DEBUG && log.debug(`Writing image ${imageId} (${imgName})...`);
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
  DEBUG && log.debug(`Processing links for ${documentComponent}...`);
  const linkIds = Object.keys(links);
  if (linkIds.length) {
    DEBUG && log.debug('Completing document.xml.rels...');
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
  DEBUG && log.debug(`Processing htmls for ${documentComponent}...`);
  const htmlIds = Object.keys(htmls);
  if (htmlIds.length) {
    // Process rels
    DEBUG && log.debug(`Completing document.xml.rels...`);
    const htmlFiles = [];
    const relsPath = `${templatePath}/_rels/${documentComponent}.rels`;
    const rels = await getRelsFromZip(zip, relsPath);
    for (let i = 0; i < htmlIds.length; i++) {
      const htmlId = htmlIds[i];
      const htmlData = htmls[htmlId];
      const htmlName = `template_${documentComponent}_${htmlId}.html`;
      DEBUG && log.debug(`Writing html ${htmlId} (${htmlName})...`);
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

// ==========================================
// Public API
// ==========================================
export default createReport;
