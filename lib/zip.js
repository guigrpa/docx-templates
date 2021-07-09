"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.zipSave = exports.zipSetBase64 = exports.zipSetBinary = exports.zipSetText = exports.zipGetText = exports.zipLoad = void 0;
var jszip_1 = __importDefault(require("jszip"));
var zipLoad = function (inputFile) { return jszip_1.default.loadAsync(inputFile); };
exports.zipLoad = zipLoad;
var zipGetText = function (zip, filename) {
    var file_in_zip = zip.file(filename);
    if (!file_in_zip)
        return null;
    return file_in_zip.async('text');
};
exports.zipGetText = zipGetText;
var zipSetText = function (zip, filename, data) {
    return zip.file(filename, data);
};
exports.zipSetText = zipSetText;
var zipSetBinary = function (zip, filename, data) {
    return zip.file(filename, data, { binary: true });
};
exports.zipSetBinary = zipSetBinary;
var zipSetBase64 = function (zip, filename, data) {
    return zip.file(filename, data, { base64: true });
};
exports.zipSetBase64 = zipSetBase64;
var zipSave = function (zip) {
    return zip.generateAsync({
        type: 'uint8array',
        compression: 'DEFLATE',
        compressionOptions: { level: 1 },
    });
};
exports.zipSave = zipSave;
