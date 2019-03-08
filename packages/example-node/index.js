require('isomorphic-fetch');
const qrcode = require('yaqrcode');
fs = require('fs-extra'); 
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
    svgImgFile: async () => {
      const data = await fs.readFile('./sample.svg');
      return { width: 6, height: 6, data, extension: '.svg', thumbnail: './sample.png' };
    },
    svgImgStr: () => {
      const data = Buffer.from(`<svg  xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                        <rect x="10" y="10" height="100" width="100" style="stroke:#ff0000; fill: #0000ff"/>
                    </svg>`, 'utf-8');
      return { width: 6, height: 6, data, extension: '.svg', thumbnail: './sample.png' };                    
      
    }
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
