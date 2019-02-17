// @flow

/* eslint-disable no-param-reassign, no-console */

import path from 'path';
import fs from 'fs-extra';
import { set as timmSet } from 'timm';
import createReportBrowser from './mainBrowser';
import type { UserOptions, UserOptionsInternal } from './types';

const DEBUG = process.env.DEBUG_DOCX_TEMPLATES;
const log: any = DEBUG ? require('./debug').mainStory : null;

const BUFFER_VALUE = 'buffer';
// ==========================================
// Main
// ==========================================
const getDefaultOutput = (templatePath: string): string => {
  const { dir, name, ext } = path.parse(templatePath);
  return path.join(dir, `${name}_report${ext}`);
};

const createReport = async (options: UserOptions) => {
  const { template, _probe } = options;
  const templateIsBuffer = template instanceof Buffer;
  const output =
    options.output ||
    (templateIsBuffer ? BUFFER_VALUE : getDefaultOutput(template.toString()));
  DEBUG && log.debug(`Output file: ${output}`);

  // ---------------------------------------------------------
  // Load template from filesystem
  // ---------------------------------------------------------
  DEBUG &&
    log.debug(
      templateIsBuffer
        ? `Reading template from buffer...`
        : `Reading template from disk at ${template.toString()}...`
    );
  const buffer = templateIsBuffer ? template : await fs.readFile(template);
  const newOptions: UserOptionsInternal = (timmSet(
    options,
    'template',
    buffer
  ): any);

  // ---------------------------------------------------------
  // Parse and fill template (in-memory)
  // ---------------------------------------------------------
  const report = await createReportBrowser(newOptions);
  if (_probe != null) return report;

  // ---------------------------------------------------------
  // Write the result on filesystem
  // ---------------------------------------------------------
  const shouldOutputBuffer = output === BUFFER_VALUE;
  DEBUG &&
    log.debug(
      shouldOutputBuffer ? 'Returning buffer' : 'Writing report to disk...'
    );
  if (shouldOutputBuffer) {
    return Buffer.from(report);
  }
  await fs.ensureDir(path.dirname(output));
  await fs.writeFile(output, report);
  return null;
};

// ==========================================
// Public API
// ==========================================
export default createReport;
