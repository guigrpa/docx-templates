import JSZip from 'jszip';

const zipLoad = (inputFile: ArrayBuffer) => JSZip.loadAsync(inputFile);
const zipGetText = (zip: JSZip, filename: string) =>
  zip.file(filename).async('text');
const zipSetText = (zip: JSZip, filename: string, data: string) =>
  zip.file(filename, data);
const zipSetBinary = (zip: JSZip, filename: string, data: ArrayBuffer) =>
  zip.file(filename, data, { binary: true });
const zipSetBase64 = (zip: JSZip, filename: string, data: string) =>
  zip.file(filename, data, { base64: true });
const zipSave = (zip: JSZip) =>
  zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 1 },
  });

// ==========================================
// Public API
// ==========================================
export { zipLoad, zipGetText, zipSetText, zipSetBinary, zipSetBase64, zipSave };
