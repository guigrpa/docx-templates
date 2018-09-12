// @flow

/* eslint-disable no-param-reassign, no-console */

import { merge } from 'timm';
import {
  zipLoad,
  zipExists,
  zipGetText,
  zipSetText,
  zipSetBinary,
  zipSetBase64,
  zipSave
} from './zip';
import { parseXml, buildXml } from './xml';
import preprocessTemplate from './preprocessTemplate';
import { extractQuery, produceJsReport } from './processTemplate';
import type { UserOptionsInternal } from './types';
import { addChild, newNonTextNode } from './reportUtils';

const DEBUG = process.env.DEBUG_DOCX_TEMPLATES;
const DEFAULT_CMD_DELIMITER = '+++';
const DEFAULT_LITERAL_XML_DELIMITER = '||';

const log: any = DEBUG ? require('./debug').mainStory : null;
const chalk: any = DEBUG ? require('./debug').chalk : null;

// ==========================================
// Main
// ==========================================
const createReport = async (options: UserOptionsInternal) => {
  DEBUG && log.debug('Report options:', { attach: options });
  const { template, data, queryVars, replaceImages, _probe } = options;
  const templatePath = 'word';
  const literalXmlDelimiter =
    options.literalXmlDelimiter || DEFAULT_LITERAL_XML_DELIMITER;
  const createOptions = {
    cmdDelimiter: options.cmdDelimiter || DEFAULT_CMD_DELIMITER,
    literalXmlDelimiter,
    processLineBreaks:
      options.processLineBreaks != null ? options.processLineBreaks : true,
    noSandbox: options.noSandbox || false,
    vm2Sandbox: options.vm2Sandbox || false,
    additionalJsContext: options.additionalJsContext || {}
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
  DEBUG && log.debug(`Template file length: ${templateXml.length}`);
  DEBUG && log.debug('Parsing XML...');
  const tic = new Date().getTime();
  const parseResult = await parseXml(templateXml);
  const jsTemplate = parseResult;
  const tac = new Date().getTime();
  DEBUG &&
    log.debug(`File parsed in ${tac - tic} ms`, {
      attach: jsTemplate,
      attachLevel: 'trace'
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
  const {
    report: report1,
    images: images1,
    links: links1,
    htmls: htmls1
  } = result;
  if (_probe === 'JS') return report1;

  // DEBUG &&
  //   log.debug('Report', {
  //     attach: report,
  //     attachLevel: 'debug',
  //     ignoreKeys: ['_parent', '_fTextNode', '_attrs'],
  //   });
  DEBUG && log.debug('Converting report to XML...');
  const reportXml = buildXml(report1, xmlOptions);
  if (_probe === 'XML') return reportXml;
  DEBUG && log.debug('Writing report...');
  zipSetText(zip, `${templatePath}/document.xml`, reportXml);

  let numImages = Object.keys(images1).length;
  let numHtmls = Object.keys(htmls1).length;
  processImages(images1, 'document.xml', zip, templatePath);
  processLinks(links1, 'document.xml', zip, templatePath);
  processHtmls(htmls1, 'document.xml', zip, templatePath, xmlOptions);

  // ---------------------------------------------------------
  // Process all other XML files (they may contain headers, etc.)
  // ---------------------------------------------------------
  const files = [];
  zip.forEach(async filePath => {
    const regex = new RegExp(`${templatePath}\\/[^\\/]+\\.xml`);
    if (regex.test(filePath) && filePath !== `${templatePath}/document.xml`) {
      files.push(filePath);
    }
  });

  let images = images1;
  let links = links1;
  let htmls = htmls1;
  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    DEBUG && log.info(`Processing ${chalk.bold(filePath)}...`);
    const raw = await zipGetText(zip, filePath);
    const js0 = await parseXml(raw);
    const js = preprocessTemplate(js0, createOptions);
    const {
      report: report2,
      images: images2,
      links: links2,
      htmls: htmls2
    } = await produceJsReport(queryResult, js, createOptions);
    images = merge(images, images2);
    links = merge(links, links2);
    htmls = merge(htmls, htmls2);
    const xml = buildXml(report2, xmlOptions);
    zipSetText(zip, filePath, xml);

    numImages += Object.keys(images2).length;

    const segments = filePath.split('/');
    const documentComponent = segments[segments.length - 1];
    processImages(images2, documentComponent, zip, templatePath);
    processLinks(links2, 'document.xml', zip, templatePath);
    processHtmls(htmls2, 'document.xml', zip, templatePath, xmlOptions);
  }

  // ---------------------------------------------------------
  // Process [Content_Types].xml
  // ---------------------------------------------------------
  if (numImages) {
    DEBUG && log.debug('Completing [Content_Types].xml for IMAGES...');
    const contentTypesPath = '[Content_Types].xml';
    const contentTypesXml = await zipGetText(zip, contentTypesPath);
    const contentTypes = await parseXml(contentTypesXml);
    // DEBUG && log.debug('Content types', { attach: contentTypes });
    const ensureContentType = (extension, contentType) => {
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
          ContentType: contentType
        })
      );
    };
    ensureContentType('png', 'image/png');
    ensureContentType('jpg', 'image/jpeg');
    ensureContentType('jpeg', 'image/jpeg');
    ensureContentType('gif', 'image/gif');
    const finalContentTypesXml = buildXml(contentTypes, xmlOptions);
    zipSetText(zip, contentTypesPath, finalContentTypesXml);
  }

  // ---------------------------------------------------------
  // Replace images
  // ---------------------------------------------------------
  if (replaceImages) {
    DEBUG && log.debug('Replacing images...');
    if (options.replaceImagesBase64) {
      const mediaPath = `${templatePath}/media`;
      const imgNames = Object.keys(replaceImages);
      for (let i = 0; i < imgNames.length; i++) {
        const imgName = imgNames[i];
        const imgPath = `${mediaPath}/${imgName}`;
        if (!zipExists(zip, `${imgPath}`)) {
          console.warn(
            `Image ${imgName} cannot be replaced: destination does not exist`
          );
          continue;
        }
        const imgData = replaceImages[imgName];
        DEBUG && log.debug(`Replacing ${imgName} with <base64 buffer>...`);
        await zipSetBase64(zip, imgPath, imgData);
      }
    } else {
      console.warn(
        'Unsupported format (path): images can only be replaced in base64 mode'
      );
    }
  }

  // ---------------------------------------------------------
  // Zip the results
  // ---------------------------------------------------------
  DEBUG && log.debug('Zipping...');
  const output = await zipSave(zip);
  return output;
};

// ==========================================
// Process images
// ==========================================
const processImages = async (images, documentComponent, zip, templatePath) => {
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
        await zipSetBase64(zip, imgPath, imgData);
      } else {
        await zipSetBinary(zip, imgPath, imgData);
      }
      addChild(
        rels,
        newNonTextNode('Relationship', {
          Id: imageId,
          Type:
            'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
          Target: `media/${imgName}`
        })
      );
    }
    const finalRelsXml = buildXml(rels, {
      literalXmlDelimiter: DEFAULT_LITERAL_XML_DELIMITER
    });
    zipSetText(zip, relsPath, finalRelsXml);
  }
};

// ==========================================
// Process links
// ==========================================
const processLinks = async (links, documentComponent, zip, templatePath) => {
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
          TargetMode: 'External'
        })
      );
    }
    const finalRelsXml = buildXml(rels, {
      literalXmlDelimiter: DEFAULT_LITERAL_XML_DELIMITER
    });
    zipSetText(zip, relsPath, finalRelsXml);
  }
};

const processHtmls = async (
  htmls,
  documentComponent,
  zip,
  templatePath,
  xmlOptions
) => {
  DEBUG && log.debug(`Processing htmls for ${documentComponent}...`);
  const htmlIds = Object.keys(htmls);
  if (htmlIds.length) {
    // Process rels
    DEBUG && log.debug(`Completing document.xml.rels...`);
    let htmlFiles = [];
    const relsPath = `${templatePath}/_rels/${documentComponent}.rels`;
    const rels = await getRelsFromZip(zip, relsPath);
    for (let i = 0; i < htmlIds.length; i++) {
      const htmlId = htmlIds[i];
      const htmlData = htmls[htmlId];
      const htmlName = `template_${documentComponent}_${htmlId}.html`;
      DEBUG && log.debug(`Writing html ${htmlId} (${htmlName})...`);
      const htmlPath = `${templatePath}/${htmlName}`;
      htmlFiles.push(`/${htmlPath}`);
      await zipSetText(zip, htmlPath, htmlData);
      addChild(
        rels,
        newNonTextNode('Relationship', {
          Id: htmlId,
          Type:
            'http://schemas.openxmlformats.org/officeDocument/2006/relationships/aFChunk',
          Target: `${htmlName}`
        })
      );
    }
    const finalRelsXml = buildXml(rels, {
      literalXmlDelimiter: DEFAULT_LITERAL_XML_DELIMITER
    });
    zipSetText(zip, relsPath, finalRelsXml);

    // Process Content Types
    DEBUG && log.debug('Completing [Content_Types].xml for HTML...');
    const contentTypesPath = '[Content_Types].xml';
    const contentTypesXml = await zipGetText(zip, contentTypesPath);
    const contentTypes = await parseXml(contentTypesXml);
    // DEBUG && log.debug('Content types', { attach: contentTypes });
    const ensureContentType = (partName, contentType) => {
      const children = contentTypes._children;
      if (
        children.filter(o => !o._fTextNode && o._attrs.PartName === partName)
          .length
      ) {
        return;
      }
      addChild(
        contentTypes,
        newNonTextNode('Override', {
          PartName: partName,
          ContentType: contentType
        })
      );
    };
    for (let htmlFile of htmlFiles) {
      ensureContentType(htmlFile, 'text/html');
    }
    const finalContentTypesXml = buildXml(contentTypes, xmlOptions);
    zipSetText(zip, contentTypesPath, finalContentTypesXml);
  }
};

const getRelsFromZip = async (zip, relsPath) => {
  let relsXml;
  try {
    relsXml = await zipGetText(zip, relsPath);
  } catch (err) {
    relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        </Relationships>`;
  }
  return await parseXml(relsXml);
};

// ==========================================
// Public API
// ==========================================
export default createReport;
