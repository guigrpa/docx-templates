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
  let newOptions = omit(options, ['template']);
  const { template, replaceImages, _probe } = options;
  const output = options.output || getDefaultOutput(template);
  DEBUG && log.debug(`Output file: ${output}`);

  // ---------------------------------------------------------
  // Load template from filesystem
  // ---------------------------------------------------------
  DEBUG && log.debug(`Reading template from disk at ${template}...`);
  const buffer = await fs.readFile(template);
  newOptions.template = buffer;

  // ---------------------------------------------------------
  // Images provided as path are converted to base64
  // ---------------------------------------------------------
  if (replaceImages) {
    if (!options.replaceImagesBase64) {
      DEBUG && log.debug('Converting images to base64...');
      let b64ReplaceImages = {};
      for (let imageName of Object.keys(replaceImages)) {
        const imageSrc = replaceImages[imageName];
        DEBUG && log.debug(`Reading ${imageSrc} from disk...`);
        const imgBuff = await fs.readFile(imageSrc);
        b64ReplaceImages[imageName] = imgBuff.toString('base64');
      }
      newOptions.replaceImagesBase64 = true;
      newOptions.replaceImages = b64ReplaceImages;
    }
  }

  // ---------------------------------------------------------
  // Parse and fill template (in-memory)
  // ---------------------------------------------------------
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
