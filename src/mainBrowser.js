// @flow

/* eslint-disable no-param-reassign, no-console */

import { unzipFile } from './zip';
import { parseXml, buildXml } from './xml';
import preprocessTemplate from './preprocessTemplate';
import { extractQuery, produceJsReport } from './processTemplate';
import type { UserOptionsInternal } from './types';

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
  };
  const xmlOptions = { literalXmlDelimiter };

  // ---------------------------------------------------------
  // Unzip
  // ---------------------------------------------------------
  DEBUG && log.debug('Unzipping...');
  const zip = await unzipFile(template);

  // ---------------------------------------------------------
  // Read the 'document.xml' file (the template) and parse it
  // ---------------------------------------------------------
  DEBUG && log.debug('Reading template...');
  const templateXml = await zip.getText(`${templatePath}/document.xml`);
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
    const query = extractQuery(jsTemplate, createOptions);
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

  DEBUG &&
    log.debug('Generating report...', {
      attach: finalTemplate,
      attachLevel: 'debug',
      ignoreKeys: ['_parent', '_fTextNode', '_attrs'],
    });
  const report = produceJsReport(queryResult, finalTemplate, createOptions);
  if (_probe === 'JS') {
    return report;
  }

  // ---------------------------------------------------------
  // Build output XML and write it to disk
  // ---------------------------------------------------------
  // DEBUG && log.debug('Report', {
  //   attach: report,
  //   attachLevel: 'debug',
  //   ignoreKeys: ['_parent', '_fTextNode', '_attrs'],
  // });
  DEBUG && log.debug('Converting report to XML...');
  const reportXml = buildXml(report, xmlOptions);
  if (_probe === 'XML') {
    return reportXml;
  }
  DEBUG && log.debug('Writing report...');
  zip.setText(`${templatePath}/document.xml`, reportXml);

  // ---------------------------------------------------------
  // Replace images
  // ---------------------------------------------------------
  if (replaceImages) {
    DEBUG && log.debug('Replacing images...');
    if (options.replaceImagesBase64) {
      const mediaPath = `${templatePath}/media`;
      const imageNames = Object.keys(replaceImages);
      for (let i = 0; i < imageNames.length; i++) {
        const imageName = imageNames[i];
        const imageDst = `${mediaPath}/${imageName}`;
        if (!zip.exists(`${imageDst}`)) {
          console.warn(
            `Image ${imageName} cannot be replaced: destination does not exist`
          );
          continue;
        }
        const imageSrc = replaceImages[imageName];
        DEBUG && log.debug(`Replacing ${imageName} with <base64 buffer>...`);
        await zip.setBin(imageDst, imageSrc);
      }
    } else {
      console.warn(
        'Unsupported format (path): images can only be replaced in base64 mode'
      );
    }
  }

  // ---------------------------------------------------------
  // Process all other XML files
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
    const raw = await zip.getText(filePath);
    const js0 = await parseXml(raw);
    const js = preprocessTemplate(js0, createOptions);
    const report2 = produceJsReport(queryResult, js, createOptions);
    const xml = buildXml(report2, xmlOptions);
    zip.setText(filePath, xml);
  }

  // ---------------------------------------------------------
  // Zip the results
  // ---------------------------------------------------------
  DEBUG && log.debug('Zipping...');
  const output = await zip.toFile();
  return output;
};

// ==========================================
// Public API
// ==========================================
export default createReport;
