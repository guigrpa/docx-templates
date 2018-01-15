// @flow

/* eslint-disable new-cap */

import JSZip from 'jszip';

JSZip.prototype.exists = function exists(filename: string) {
  return this.file(filename) != null;
};
JSZip.prototype.getText = function getText(filename: string) {
  return this.file(filename).async('text');
};
JSZip.prototype.getBin = function getBin(filename: string) {
  return this.file(filename).async('base64');
};
JSZip.prototype.setText = function setText(filename: string, data: string) {
  this.file(filename, data);
};
JSZip.prototype.setBin = function setBin(filename: string, data: string) {
  this.file(filename, data, { base64: true });
};
JSZip.prototype.toFile = function toFile() {
  return this.generateAsync({ type: 'uint8array' });
};

const unzipFile = function unzipFile(inputFile: ArrayBuffer) {
  return JSZip.loadAsync(inputFile);
};

// ==========================================
// Public API
// ==========================================
export { unzipFile };
