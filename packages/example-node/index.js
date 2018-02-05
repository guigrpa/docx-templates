require('isomorphic-fetch');
const qrcode = require('yaqrcode');
const createReport = require('docx-templates').default;

createReport({
  template: process.argv[2],
  output: process.argv.length > 3 ? process.argv[3] : null,
  data: query =>
    fetch('http://swapi.apis.guru', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    })
      .then(res => res.json())
      .then(res => res.data),
  additionalJsContext: {
    tile: async (z, x, y, size = 3) => {
      const resp = await fetch(
        `http://tile.stamen.com/toner/${z}/${x}/${y}.png`
      );
      const buffer = resp.arrayBuffer
        ? await resp.arrayBuffer()
        : await resp.buffer();
      return { width: size, height: size, data: buffer, extension: '.png' };
    },
    qr: contents => {
      const dataUrl = qrcode(contents, { size: 500 });
      const data = dataUrl.slice('data:image/gif;base64,'.length);
      return { width: 6, height: 6, data, extension: '.gif' };
    },
  },
});

/*
{
  allFilms {
    edges {
      node {
        title
      }
    }
  }
}
 */
