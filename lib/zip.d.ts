import JSZip from 'jszip';
declare const zipLoad: (inputFile: ArrayBuffer) => Promise<JSZip>;
declare const zipGetText: (zip: JSZip, filename: string) => Promise<string> | null;
declare const zipSetText: (zip: JSZip, filename: string, data: string) => JSZip;
declare const zipSetBinary: (zip: JSZip, filename: string, data: ArrayBuffer) => JSZip;
declare const zipSetBase64: (zip: JSZip, filename: string, data: string) => JSZip;
declare const zipSave: (zip: JSZip) => Promise<Uint8Array>;
export { zipLoad, zipGetText, zipSetText, zipSetBinary, zipSetBase64, zipSave };
