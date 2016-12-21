// @flow

/* eslint-disable new-cap */

import Promise from 'bluebird';
import fs from 'fs-extra';
import fstream from 'fstream';
import unzip from 'unzip';
import archiver from 'archiver';

const unzipFile = (inputFile: string, outputFolder: string) => {
  const readStream = fs.createReadStream(inputFile);
  const writeStream = fstream.Writer(outputFolder);
  return new Promise((resolve) => {
    readStream
    .pipe(unzip.Parse())
    .pipe(writeStream)
    .on('close', resolve);
  });
};

const zipFile = (inputFolder: string, outputFile: string) => {
  const output = fs.createWriteStream(outputFile);
  const archive = archiver('zip');
  return new Promise((resolve, reject) => {
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);
    archive.bulk([{ expand: true, dot: true, cwd: inputFolder, src: '**' }]);
    archive.finalize();
  });
};

// ==========================================
// Public API
// ==========================================
export {
  unzipFile,
  zipFile,
};
