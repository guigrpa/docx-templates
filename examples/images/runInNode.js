require('isomorphic-fetch');
const qrcode = require('yaqrcode');
const createReport = require('../../lib/indexNode');

createReport({
  template: process.argv[2],
  output: process.argv.length > 3 ? process.argv[3] : null,
  additionalJsContext: {
    tile: async (z, x, y) => {
      const resp = await fetch(
        `http://tile.stamen.com/toner/${z}/${x}/${y}.png`
      );
      const buffer = resp.arrayBuffer
        ? await resp.arrayBuffer()
        : await resp.buffer();
      return { width: 3, height: 3, data: buffer, extension: '.png' };
    },
    qr: contents => {
      const dataUrl = qrcode(contents, { size: 500 });
      const data = dataUrl.slice('data:image/gif;base64,'.length);
      return { width: 6, height: 6, data, extension: '.gif' };
    },
  },
});
