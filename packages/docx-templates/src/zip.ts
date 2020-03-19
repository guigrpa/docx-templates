import JSZip from 'jszip';

const zipInit = () => {
  initCache();
};
const zipLoad = (inputFile: ArrayBuffer) => JSZip.loadAsync(inputFile);
const zipGetText = (zip: JSZip, filename: string) =>
  getFile(zip, filename);
const zipSetText = (zip: JSZip, filename: string, data: string) =>
  setFile(zip, filename, data);
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
// Cache outputs (so that they can be requested again)
// ==========================================
let cache: { [k: string]: string | null } = {};

const getFile = async (zip: JSZip, filename: string): Promise<string | null> => {
  if (cache[filename] !== undefined) return cache[filename];
  let out: string | null;
  try {
    out = await zip.file(filename).async('text');
  } catch (err) {
    out = null;
  }
  cache[filename] = out;
  return out;
};

const setFile = (zip: JSZip, filename: string, data: string) => {
  cache[filename] = data;
  return
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
  zipGetText,
  zipSetText,
  zipSetBinary,
  zipSetBase64,
  zipSave,
};
