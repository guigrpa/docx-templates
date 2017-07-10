// @flow

/* eslint-disable new-cap */

import fs from 'fs-extra';

const overWriteImageBase64 = (oldImg: string, newImg: string) => fs.writeFile(oldImg, new Buffer(newImg, 'base64'));

const overWriteImagePath = (oldImg: string, buffer: string) => fs.writeFile(oldImg, buffer);

const findProp = (obj: any, property: string) =>
  obj[Object.keys(obj).find((key) => key === property)];

// ==========================================
// Public API
// ==========================================
export {
  overWriteImageBase64,
  overWriteImagePath,
  findProp,
};
