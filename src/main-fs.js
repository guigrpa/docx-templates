// @flow

/* eslint-disable no-param-reassign, no-console */

import path from 'path';
import fs from 'fs-extra';
import { omit } from 'timm';
import type { UserOptions } from './types';
const createReportBuff = require('./main-buff').default;


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
  const { template, _probe } = options;
  const output = options.output || getDefaultOutput(template);
  DEBUG && log.debug(`Output file: ${output}`);
  DEBUG && log.debug(`Reading template from disk at ${template}...`);
  const buffer = await fs.readFile(template);

  // ---------------------------------------------------------
  // Parse and fill template (in-memory)
  // ---------------------------------------------------------
  let newOptions = omit(options, ['template']);
  newOptions.template = buffer;
  const report = await createReportBuff(newOptions);

  if (_probe === 'JS' || _probe === 'XML') {
    return report;
  }

  // ---------------------------------------------------------
  // Write the result on filesystem
  // ---------------------------------------------------------
  DEBUG && log.debug('Writing report to disk...');
  await fs.ensureDir(path.dirname(output));
  await fs.writeFile(output, report);
  return null;
};

// ==========================================
// Public API
// ==========================================
export default createReport;
