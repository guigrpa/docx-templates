// @flow

/* eslint-disable new-cap */

import JSZip from 'jszip';

const zipInit = () => {
  initCache();
};
const zipLoad = (inputFile: ArrayBuffer) => JSZip.loadAsync(inputFile);
const zipExists = (zip: Object, filename: string) => zip.file(filename) != null;
const zipGetText = (zip: Object, filename: string) =>
  getFile(zip, filename, 'text');
const zipSetText = (zip: Object, filename: string, data: string) =>
  setFile(zip, filename, data);
const zipSetBinary = (zip: Object, filename: string, data: ArrayBuffer) =>
  setFile(zip, filename, data, { binary: true });
const zipSetBase64 = (zip: Object, filename: string, data: string) =>
  setFile(zip, filename, data, { base64: true });
const zipSave = (zip: Object) =>
  zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 1 },
  });

// ==========================================
// Cache outputs (so that they can be requested again)
// ==========================================
let cache = {};

const getFile = async (zip, filename, format) => {
  if (cache[filename] !== undefined) return cache[filename];
  let out;
  try {
    out = await zip.file(filename).async(format);
  } catch (err) {
    out = null;
  }
  cache[filename] = out;
  return out;
};

const setFile = (zip, filename, data, options) => {
  cache[filename] = data;
  return zip.file(filename, data, options);
};

const initCache = () => {
  cache = {};
};

// ==========================================
// Public API
// ==========================================
export {
  zipInit,
  zipLoad,
  zipExists,
  zipGetText,
  zipSetText,
  zipSetBinary,
  zipSetBase64,
  zipSave,
};
