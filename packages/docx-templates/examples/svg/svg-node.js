require('isomorphic-fetch');
const qrcode = require('yaqrcode');
const createReport = require('../../lib/indexNode.js').default;
let path = require('path');
let fs = require('fs');

createReport({
  template: process.argv[2],
  output: process.argv.length > 3 ? process.argv[3] : null,
  additionalJsContext: {
    insertSVG: () => {
      let pt = path.resolve(__dirname, `./images/test.svg`);
      let img64 = toBase64(pt);
      return { width: 3, height: 3, data: img64, extension: '.svg'};
    },
    insertPNG: () => {
      let pt = path.resolve(__dirname, `./images/test.png`);
      let img64 = toBase64(pt);
      return { width: 3, height: 3, data: img64, extension: '.png'};
    },
  },
});

function bufferData (path) {
  let fs   = require('fs')
  return  fs.readFileSync(path)
}

function toBase64 (path) {
  let fs   = require('fs')
  let data = fs.readFileSync(path)
  return data.toString('base64')
}