// @flow

/* eslint-disable no-param-reassign, no-console */

import path from 'path';
import fs from 'fs-extra';
import { set as timmSet } from 'timm';
import type { UserOptions, UserOptionsInternal } from './types';

const createReportBuff = require('./mainBrowser').default;

const DEBUG = process.env.DEBUG_DOCX_TEMPLATES;
const log: any = DEBUG ? require('./debug').mainStory : null;

// ==========================================
// Main
// ==========================================
const getDefaultOutput = (templatePath: string): string => {
  const { dir, name, ext } = path.parse(templatePath);
  return path.join(dir, `${name}_report${ext}`);
};

const createReport = async (options: UserOptions) => {
  const { template, replaceImages, _probe } = options;
  const output = options.output || getDefaultOutput(template);
  DEBUG && log.debug(`Output file: ${output}`);

  // ---------------------------------------------------------
  // Load template from filesystem
  // ---------------------------------------------------------
  DEBUG && log.debug(`Reading template from disk at ${template}...`);
  const buffer = await fs.readFile(template);
  const newOptions: UserOptionsInternal = (timmSet(
    options,
    'template',
    buffer
  ): any);

  // ---------------------------------------------------------
  // Images provided as path are converted to base64
  // ---------------------------------------------------------
  if (replaceImages) {
    if (!options.replaceImagesBase64) {
      DEBUG && log.debug('Converting images to base64...');
      const b64ReplaceImages = {};
      const imageNames = Object.keys(replaceImages);
      for (let i = 0; i < imageNames.length; i++) {
        const imageName = imageNames[i];
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
