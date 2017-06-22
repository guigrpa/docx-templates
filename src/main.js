// @flow

/* eslint-disable no-param-reassign */

import path from 'path';
import os from 'os';
import Promise from 'bluebird';
import fs from 'fs-extra';
import uuid from 'uuid';
import globby from 'globby';
import { zipFile, unzipFile } from './zip';
import { parseXml, buildXml } from './xml';
import preprocessTemplate from './preprocessTemplate';
import { extractQuery, produceJsReport } from './processTemplate';
import type { UserOptions } from './types';
import { overWriteImage } from './img';

const DEBUG = process.env.DEBUG_DOCX_TEMPLATES;
const DEFAULT_CMD_DELIMITER = '+++';
const DEFAULT_LITERAL_XML_DELIMITER = '||';

const log: any = DEBUG ? require('./debug').mainStory : null;

const fsPromises = {};
['emptyDir', 'ensureDir', 'readFile', 'writeFile', 'remove'].forEach((fn) => {
  fsPromises[fn] = Promise.promisify(fs[fn]);
});

// ==========================================
// Main
// ==========================================
const getDefaultOutput = (templatePath: string): string => {
  const { dir, name, ext } = path.parse(templatePath);
  return path.join(dir, `${name}_report${ext}`);
};

const createReport = (options: UserOptions): Promise<any> => {
  DEBUG && log.debug('Report options:', { attach: options });
  const { template, data, queryVars, _probe } = options;
  const output = options.output || getDefaultOutput(template);
  DEBUG && log.debug(`Output file: ${output}`);
  const base = path.join(os.tmpdir(), uuid.v1());
  const baseUnzipped = `${base}_unzipped`;
  DEBUG && log.debug(`Temporary base: ${base}`);
  const literalXmlDelimiter = options.literalXmlDelimiter || DEFAULT_LITERAL_XML_DELIMITER;
  const createOptions = {
    cmdDelimiter: options.cmdDelimiter || DEFAULT_CMD_DELIMITER,
    literalXmlDelimiter,
    processLineBreaks: options.processLineBreaks != null ? options.processLineBreaks : true,
  };
  const xmlOptions = { literalXmlDelimiter };

  let jsTemplate;
  let queryResult = null;
  const templatePath = `${base}_unzipped/word`;
  let tic;
  let result;
  return Promise.resolve()

  // Unzip
  .then(() => {
    DEBUG && log.debug('Unzipping...');
    return fsPromises.emptyDir(baseUnzipped)
    .then(() => unzipFile(template, baseUnzipped));
  })

  // Read the 'document.xml' file (the template) and parse it
  .then(() => {
    DEBUG && log.debug('Reading template...');
    return fsPromises.readFile(`${templatePath}/document.xml`, 'utf8')
    .then((templateXml) => {
      DEBUG && log.debug(`Template file length: ${templateXml.length}`);
      DEBUG && log.debug('Parsing XML...');
      tic = new Date().getTime();
      return parseXml(templateXml);
    }).then((parseResult) => {
      jsTemplate = parseResult;
      const tac = new Date().getTime();
      DEBUG && log.debug(`File parsed in ${tac - tic} ms`,
        { attach: jsTemplate, attachLevel: 'trace' });
    });
  })

  // Fetch the data that will fill in the template
  .then(() => {
    if (typeof data !== 'function') {
      queryResult = data;
      return null;
    }
    DEBUG && log.debug('Looking for the query in the template...');
    const query = extractQuery(jsTemplate, createOptions);
    DEBUG && log.debug(`Query: ${query || 'no query found'}`);
    return Promise.resolve(data(query, queryVars)).then((o) => { queryResult = o; });
  })

  // Generate the report
  .then(() => {
    // DEBUG && log.debug('Before preprocessing...', {
    //   attach: jsTemplate,
    //   attachLevel: 'debug',
    //   ignoreKeys: ['_parent', '_fTextNode', '_attrs'],
    // });
    const finalTemplate = preprocessTemplate(jsTemplate, createOptions);
    DEBUG && log.debug('Generating report...', {
      attach: finalTemplate,
      attachLevel: 'debug',
      ignoreKeys: ['_parent', '_fTextNode', '_attrs'],
    });
    return produceJsReport(queryResult, finalTemplate, createOptions);
  })

  // Build output XML and write it to disk
  .then((report) => {
    // DEBUG && log.debug('Report', {
    //   attach: report,
    //   attachLevel: 'debug',
    //   ignoreKeys: ['_parent', '_fTextNode', '_attrs'],
    // });
    result = report;
    if (_probe === 'JS') {
      result = report;
      return null;
    }
    DEBUG && log.debug('Converting report to XML...');
    const reportXml = buildXml(report, xmlOptions);
    if (_probe === 'XML') {
      result = reportXml;
      return null;
    }
    DEBUG && log.debug('Writing report...');
    return fsPromises.writeFile(`${templatePath}/document.xml`, reportXml);
  })

  // change images 
  .then(() => {
    if (!fs.existsSync(`${templatePath}/media/`)) {
      // not found dir
      return ; 
    }
    overWriteImage(`${templatePath}/media/`, options)
    return ;
  })

  // Process all other XML files
  .then(() =>
    globby([`${templatePath}/*.xml`, `!${templatePath}/document.xml`])
    .then((files) => Promise.all(files.map((filePath) => {
      DEBUG && log.info(`Processing ${filePath}...`);
      return fsPromises.readFile(filePath, 'utf8')
      .then(parseXml)
      .then((js0) => {
        const js = preprocessTemplate(js0, createOptions);
        return produceJsReport(queryResult, js, createOptions);
      })
      .then((js) => {
        const xml = buildXml(js, xmlOptions);
        return fsPromises.writeFile(filePath, xml);
      });
    })))  // eslint-disable-line
  )

  // Zip the results
  .then(() => {
    if (_probe) {
      return fsPromises.remove(baseUnzipped)
      .then(() => result);
    }
    DEBUG && log.debug('Zipping...');
    return fsPromises.ensureDir(path.dirname(output))
    .then(() => zipFile(baseUnzipped, output))
    .finally(() => fsPromises.remove(baseUnzipped));
  });
};

// ==========================================
// Public API
// ==========================================
export default createReport;
