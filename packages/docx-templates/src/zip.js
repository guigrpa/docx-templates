// @flow

/* eslint-disable new-cap */

import JSZip from 'jszip';

const zipLoad = (inputFile: ArrayBuffer) => JSZip.loadAsync(inputFile);
const zipExists = (zip: Object, filename: string) => zip.file(filename) != null;
const zipGetText = (zip: Object, filename: string) =>
  zip.file(filename).async('text');
const zipSetText = (zip: Object, filename: string, data: string) =>
  zip.file(filename, data);
const zipSetBinary = (zip: Object, filename: string, data: ArrayBuffer) =>
  zip.file(filename, data, { binary: true });
const zipSetBase64 = (zip: Object, filename: string, data: string) =>
  zip.file(filename, data, { base64: true });
const zipSave = (zip: Object) =>
  zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 1 }
  });

// ==========================================
// Public API
// ==========================================
export {
  zipLoad,
  zipExists,
  zipGetText,
  zipSetText,
  zipSetBinary,
  zipSetBase64,
  zipSave
};
