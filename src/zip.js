// @flow

/* eslint-disable new-cap */

import JSZip from 'jszip';

const unzipFile = (inputFile: ArrayBuffer) => {
  return JSZip.loadAsync(inputFile)
  .then(zip => {
      zip.exists = function(filename: string) {
        return this.file(filename) != null;
      };
      zip.getText = function(filename: string) {
        return this.file(filename).async('text');
      };
      zip.getBin = function(filename: string) {
        return this.file(filename).async('base64');
      };
      zip.setText = function(filename: string, data: string) {
        this.file(filename, data);
      };
      zip.setBin = function(filename: string, data: string) {
        this.file(filename, data, {base64: true});
      };
      zip.toFile = function() {
        return this.generateAsync({type: 'uint8array'});
      };
      return Promise.resolve(zip);
  });
};

// ==========================================
// Public API
// ==========================================
export { unzipFile };
