// @flow

/* eslint-disable no-param-reassign, no-console */

import 'babel-polyfill';
import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import uuid from 'uuid';
import globby from 'globby';
import { zipFile, unzipFile } from './zip';
import { parseXml, buildXml } from './xml';
import preprocessTemplate from './preprocessTemplate';
import { extractQuery, produceJsReport } from './processTemplate';
import type { UserOptions } from './types';

const DEBUG = process.env.DEBUG_DOCX_TEMPLATES;
const DEFAULT_CMD_DELIMITER = '+++';
const DEFAULT_LITERAL_XML_DELIMITER = '||';

const log: any = DEBUG ? require('./debug').mainStory : null;

// ==========================================
// Main
// ==========================================
const getDefaultOutput = (templatePath: string): string => {
  const { dir, name, ext } = path.parse(templatePath);
  return path.join(dir, `${name}_report${ext}`);
};

const createReport = async (options: UserOptions) => {
  DEBUG && log.debug('Report options:', { attach: options });
  const { template, data, queryVars, replaceImages, _probe } = options;
  const output = options.output || getDefaultOutput(template);
  DEBUG && log.debug(`Output file: ${output}`);
  const base = path.join(os.tmpdir(), uuid.v1());
  const baseUnzipped = `${base}_unzipped`;
  DEBUG && log.debug(`Temporary base: ${base}`);
  const templatePath = `${baseUnzipped}/word`;
  const literalXmlDelimiter =
    options.literalXmlDelimiter || DEFAULT_LITERAL_XML_DELIMITER;
  const createOptions = {
    cmdDelimiter: options.cmdDelimiter || DEFAULT_CMD_DELIMITER,
    literalXmlDelimiter,
    processLineBreaks:
      options.processLineBreaks != null ? options.processLineBreaks : true,
  };
  const xmlOptions = { literalXmlDelimiter };

  // ---------------------------------------------------------
  // Unzip
  // ---------------------------------------------------------
  DEBUG && log.debug('Unzipping...');
  await fs.emptyDir(baseUnzipped);
  await unzipFile(template, baseUnzipped);

  // ---------------------------------------------------------
  // Read the 'document.xml' file (the template) and parse it
  // ---------------------------------------------------------
  DEBUG && log.debug('Reading template...');
  const templateXml = await fs.readFile(`${templatePath}/document.xml`, 'utf8');
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
    await cleanUp(baseUnzipped);
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
    await cleanUp(baseUnzipped);
    return reportXml;
  }
  DEBUG && log.debug('Writing report...');
  await fs.writeFile(`${templatePath}/document.xml`, reportXml);

  // ---------------------------------------------------------
  // Replace images
  // ---------------------------------------------------------
  if (replaceImages) {
    DEBUG && log.debug('Replacing images...');
    const mediaPath = `${templatePath}/media`;
    const imageNames = Object.keys(replaceImages);
    for (let i = 0; i < imageNames.length; i++) {
      const imageName = imageNames[i];
      const imageDst = `${mediaPath}/${imageName}`;
      if (!fs.existsSync(`${imageDst}`)) {
        console.warn(
          `Image ${imageName} cannot be replaced: destination does not exist`
        );
        continue;
      }
      const imageSrc = replaceImages[imageName];
      if (options.replaceImagesBase64) {
        DEBUG && log.debug(`Replacing ${imageName} with <base64 buffer>...`);
        await fs.writeFile(imageDst, new Buffer(imageSrc, 'base64'));
      } else {
        DEBUG && log.debug(`Replacing ${imageName} with ${imageSrc}...`);
        await fs.copy(imageSrc, imageDst);
      }
    }
  }

  // ---------------------------------------------------------
  // Process all other XML files
  // ---------------------------------------------------------
  const files = await globby([
    `${templatePath}/*.xml`,
    `!${templatePath}/document.xml`,
  ]);
  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    DEBUG && log.info(`Processing ${filePath}...`);
    const raw = await fs.readFile(filePath, 'utf8');
    const js0 = await parseXml(raw);
    const js = preprocessTemplate(js0, createOptions);
    const report2 = produceJsReport(queryResult, js, createOptions);
    const xml = buildXml(report2, xmlOptions);
    await fs.writeFile(filePath, xml);
  }

  // ---------------------------------------------------------
  // Zip the results
  // ---------------------------------------------------------
  DEBUG && log.debug('Zipping...');
  try {
    await fs.ensureDir(path.dirname(output));
    await zipFile(baseUnzipped, output);
  } finally {
    await fs.remove(baseUnzipped);
  }
  return null;
};

// ==========================================
// Helpers
// ==========================================
const cleanUp = async baseUnzipped => fs.remove(baseUnzipped);

// ==========================================
// Public API
// ==========================================
export default createReport;
