// @flow

/* eslint-disable new-cap */

import fs from 'fs-extra';
import type { CustomImg } from './types';

const overWriteImage = (oldImg: string, newImg: CustomImg | void) => {
  if (newImg && newImg.id && newImg.strBase64) {
    const decodedImage = new Buffer(newImg.strBase64, 'base64');
    return fs.writeFile(oldImg, decodedImage);
  }
  return undefined;
};

// ==========================================
// Public API
// ==========================================
export {
  overWriteImage,
};
