// @flow

/* eslint-disable no-param-reassign, no-console */

import {
  zipLoad,
  zipExists,
  zipGetText,
  zipSetText,
  zipSetBinary,
  zipSetBase64,
  zipSave,
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
    additionalJsContext: options.additionalJsContext || {},
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
      attachLevel: 'trace',
    });

  // ---------------------------------------------------------
  // Fetch the data that will fill in the template
  // ---------------------------------------------------------
  let queryResult = null;
  if (typeof data === 'function') {
    DEBUG && log.debug('Looking for the query in the template...');
    const query = await extractQuery(jsTemplate, createOptions);
    DEBUG && log.debug(`Query: ${query || 'no query found'}`);
    queryResult = await data(query, queryVars);
  } else {
    queryResult = data;
  }

  // ---------------------------------------------------------
  // Generate the report
  // ---------------------------------------------------------
  // DEBUG && log.debug('Before preprocessing...', {
  //   attach: jsTemplate,
  //   attachLevel: 'debug',
  //   ignoreKeys: ['_parent', '_fTextNode', '_attrs'],
  // });
  const finalTemplate = preprocessTemplate(jsTemplate, createOptions);

  // DEBUG &&
  //   log.debug('Generating report...', {
  //     attach: finalTemplate,
  //     attachLevel: 'debug',
  //     ignoreKeys: ['_parent', '_fTextNode', '_attrs'],
  //   });
  const { report, images } = await produceJsReport(
    queryResult,
    finalTemplate,
    createOptions
  );
  if (_probe === 'JS') return report;

  // ---------------------------------------------------------
  // Build output XML and write it to disk
  // ---------------------------------------------------------
  // DEBUG &&
  //   log.debug('Report', {
  //     attach: report,
  //     attachLevel: 'debug',
  //     ignoreKeys: ['_parent', '_fTextNode', '_attrs'],
  //   });
  DEBUG && log.debug('Converting report to XML...');
  const reportXml = buildXml(report, xmlOptions);
  if (_probe === 'XML') return reportXml;
  DEBUG && log.debug('Writing report...');
  zipSetText(zip, `${templatePath}/document.xml`, reportXml);

  // ---------------------------------------------------------
  // Add images
  // ---------------------------------------------------------
  DEBUG && log.debug('Processing images...');
  const imageIds = Object.keys(images);
  if (imageIds.length) {
    DEBUG && log.debug('Completing document.xml.rels...');
    const relsPath = `${templatePath}/_rels/document.xml.rels`;
    const relsXml = await zipGetText(zip, relsPath);
    const rels = await parseXml(relsXml);
    for (let i = 0; i < imageIds.length; i++) {
      const imageId = imageIds[i];
      const { extension, data: imgData } = images[imageId];
      const imgName = `template_image${i + 1}${extension}`;
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
          Target: `media/${imgName}`,
        })
      );
    }
    const finalRelsXml = buildXml(rels, xmlOptions);
    zipSetText(zip, relsPath, finalRelsXml);

    // Process [Content_Types].xml
    DEBUG && log.debug('Completing [Content_Types].xml...');
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
          ContentType: contentType,
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
  // Process all other XML files (they may contain headers, etc.)
  // ---------------------------------------------------------
  const files = [];
  zip.forEach(async filePath => {
    const regex = new RegExp(`${templatePath}\\/[^\\/]+\\.xml`);
    if (regex.test(filePath) && filePath !== `${templatePath}/document.xml`) {
      files.push(filePath);
    }
  });

  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    DEBUG && log.info(`Processing ${filePath}...`);
    const raw = await zipGetText(zip, filePath);
    const js0 = await parseXml(raw);
    const js = preprocessTemplate(js0, createOptions);
    const { report: report2 } = await produceJsReport(
      queryResult,
      js,
      createOptions
    );
    const xml = buildXml(report2, xmlOptions);
    zipSetText(zip, filePath, xml);
  }

  // ---------------------------------------------------------
  // Zip the results
  // ---------------------------------------------------------
  DEBUG && log.debug('Zipping...');
  const output = await zipSave(zip);
  return output;
};

// ==========================================
// Public API
// ==========================================
export default createReport;
