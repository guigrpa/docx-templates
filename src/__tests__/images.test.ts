/* eslint-env jest */

import path from 'path';
import fs from 'fs';
import { createReport } from '../index';
import { Image, ImagePars } from '../types';
import { setDebugLogSink } from '../debug';
import JSZip from 'jszip';

if (process.env.DEBUG) setDebugLogSink(console.log);

it('001: Issue #61 Correctly renders an SVG image', async () => {
  const template = await fs.promises.readFile(
    path.join(__dirname, 'fixtures', 'imagesSVG.docx')
  );

  // Use a random png file as a thumbnail
  const thumbnail: Image = {
    data: await fs.promises.readFile(
      path.join(__dirname, 'fixtures', 'sample.png')
    ),
    extension: '.png',
  };

  const opts = {
    template,
    data: {},
    additionalJsContext: {
      svgImgFile: async () => {
        const data = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'sample.svg')
        );
        return {
          width: 6,
          height: 6,
          data,
          extension: '.svg',
          thumbnail,
        };
      },
      svgImgStr: () => {
        const data = Buffer.from(
          `<svg  xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                                  <rect x="10" y="10" height="100" width="100" style="stroke:#ff0000; fill: #0000ff"/>
                              </svg>`,
          'utf-8'
        );
        return {
          width: 6,
          height: 6,
          data,
          extension: '.svg',
          thumbnail,
        };
      },
    },
  };

  const result = await createReport(opts, 'JS');
  expect(result).toMatchSnapshot();
});

it('002: throws when thumbnail is incorrectly provided when inserting an SVG', async () => {
  const template = await fs.promises.readFile(
    path.join(__dirname, 'fixtures', 'imagesSVG.docx')
  );
  const thumbnail = {
    data: await fs.promises.readFile(
      path.join(__dirname, 'fixtures', 'sample.png')
    ),
    // extension: '.png', extension is not given
  };

  const opts = {
    template,
    data: {},
    additionalJsContext: {
      svgImgFile: async () => {
        const data = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'sample.svg')
        );
        return {
          width: 6,
          height: 6,
          data,
          extension: '.svg',
          thumbnail,
        };
      },
      svgImgStr: () => {
        const data = Buffer.from(
          `<svg  xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                                  <rect x="10" y="10" height="100" width="100" style="stroke:#ff0000; fill: #0000ff"/>
                              </svg>`,
          'utf-8'
        );
        return {
          width: 6,
          height: 6,
          data,
          extension: '.svg',
          thumbnail,
        };
      },
    },
  };

  return expect(createReport(opts)).rejects.toMatchSnapshot();
});

it('003: can inject an svg without a thumbnail', async () => {
  const template = await fs.promises.readFile(
    path.join(__dirname, 'fixtures', 'imagesSVG.docx')
  );

  const opts = {
    template,
    data: {},
    additionalJsContext: {
      svgImgFile: async () => {
        const data = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'sample.svg')
        );
        return {
          width: 6,
          height: 6,
          data,
          extension: '.svg',
        };
      },
      svgImgStr: () => {
        const data = Buffer.from(
          `<svg  xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                                  <rect x="10" y="10" height="100" width="100" style="stroke:#ff0000; fill: #0000ff"/>
                              </svg>`,
          'utf-8'
        );
        return {
          width: 6,
          height: 6,
          data,
          extension: '.svg',
        };
      },
    },
  };
  const result = await createReport(opts, 'JS');
  expect(result).toMatchSnapshot();
});

it('004: can inject an image in the document header (regression test for #113)', async () => {
  const template = await fs.promises.readFile(
    path.join(__dirname, 'fixtures', 'imageHeader.docx')
  );

  const opts = {
    template,
    data: {},
    additionalJsContext: {
      image: async () => {
        const data = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'sample.png')
        );
        return {
          width: 6,
          height: 6,
          data,
          extension: '.png',
        };
      },
    },
  };

  // NOTE: bug does not happen when using debug probe arguments ('JS' or 'XML'),
  // as these exit before the headers are parsed.
  // TODO: build a snapshot test once _probe === 'XML' properly includes all document XMLs, not just
  // the main document
  expect(await createReport(opts)).toBeInstanceOf(Uint8Array);
});

it('005: can inject PNG files using ArrayBuffers without errors (related to issue #166)', async () => {
  const template = await fs.promises.readFile(
    path.join(__dirname, 'fixtures', 'imageSimple.docx')
  );

  const buff = await fs.promises.readFile(
    path.join(__dirname, 'fixtures', 'sample.png')
  );

  function toArrayBuffer(buf: Buffer): ArrayBuffer {
    const ab = new ArrayBuffer(buf.length);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buf.length; ++i) {
      view[i] = buf[i];
    }
    return ab;
  }

  const fromAB = await createReport({
    template,
    data: {},
    additionalJsContext: {
      injectImg: () => {
        return {
          width: 6,
          height: 6,
          data: toArrayBuffer(buff),
          extension: '.png',
        };
      },
    },
  });

  const fromB = await createReport({
    template,
    data: {},
    additionalJsContext: {
      injectImg: () => {
        return {
          width: 6,
          height: 6,
          data: buff,
          extension: '.png',
        };
      },
    },
  });
  expect(fromAB).toBeInstanceOf(Uint8Array);
  expect(fromB).toBeInstanceOf(Uint8Array);
  expect(fromAB).toStrictEqual(fromB);
});

it('006: can inject an image from the data instead of the additionalJsContext', async () => {
  const template = await fs.promises.readFile(
    path.join(__dirname, 'fixtures', 'imageSimple.docx')
  );
  const buff = await fs.promises.readFile(
    path.join(__dirname, 'fixtures', 'sample.png')
  );
  const reportA = await createReport({
    template,
    data: {
      injectImg: () => ({
        width: 6,
        height: 6,
        data: buff,
        extension: '.png',
      }),
    },
  });
  const reportB = await createReport({
    template,
    data: {},
    additionalJsContext: {
      injectImg: () => ({
        width: 6,
        height: 6,
        data: buff,
        extension: '.png',
      }),
    },
  });
  expect(reportA).toBeInstanceOf(Uint8Array);
  expect(reportB).toBeInstanceOf(Uint8Array);
  expect(reportA).toStrictEqual(reportB);

  // Ensure only one 'media' element (the image data as a png file) is added to the final docx file.
  // Regression test for #218
  const zip = await JSZip.loadAsync(reportA);
  expect(Object.keys(zip?.files ?? {})).toMatchInlineSnapshot(`
    [
      "[Content_Types].xml",
      "_rels/.rels",
      "word/_rels/document.xml.rels",
      "word/document.xml",
      "word/theme/theme1.xml",
      "word/settings.xml",
      "word/fontTable.xml",
      "word/webSettings.xml",
      "docProps/app.xml",
      "docProps/core.xml",
      "word/styles.xml",
      "word/",
      "word/media/",
      "word/media/template_document.xml_img1.png",
      "word/_rels/",
    ]
  `);
});

it('007: can inject an image in a document that already contains images (regression test for #144)', async () => {
  const template = await fs.promises.readFile(
    path.join(__dirname, 'fixtures', 'imageExisting.docx')
  );
  const buff = await fs.promises.readFile(
    path.join(__dirname, 'fixtures', 'sample.png')
  );
  expect(
    await createReport(
      {
        template,
        data: {
          cv: { ProfilePicture: { url: 'abc' } },
        },
        additionalJsContext: {
          getImage: () => ({
            width: 6,
            height: 6,
            data: buff,
            extension: '.png',
          }),
        },
      },
      'XML'
    )
  ).toMatchSnapshot();
});

it('008: can inject an image in a shape in the doc footer (regression test for #217)', async () => {
  const template = await fs.promises.readFile(
    path.join(__dirname, 'fixtures', 'imageInShapeInFooter.docx')
  );
  const thumbnail_data = await fs.promises.readFile(
    path.join(__dirname, 'fixtures', 'sample.png')
  );

  const report = await createReport(
    {
      template,
      data: {},
      additionalJsContext: {
        injectSvg: () => {
          const svg_data = Buffer.from(
            `<svg  xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                                    <rect x="10" y="10" height="100" width="100" style="stroke:#ff0000; fill: #0000ff"/>
                                  </svg>`,
            'utf-8'
          );
          const thumbnail = {
            data: thumbnail_data,
            extension: '.png',
          };
          return {
            width: 6,
            height: 6,
            data: svg_data,
            extension: '.svg',
            thumbnail,
          };
        },
      },
    },
    'XML'
  );
  expect(report).toMatchSnapshot();
});

it('009 correctly rotate image', async () => {
  const template = await fs.promises.readFile(
    path.join(__dirname, 'fixtures', 'imageRotation.docx')
  );
  const buff = await fs.promises.readFile(
    path.join(__dirname, 'fixtures', 'sample.png')
  );
  const opts = {
    template,
    data: {},
    additionalJsContext: {
      getImage: (): ImagePars => ({
        width: 6,
        height: 6,
        data: buff,
        extension: '.png',
      }),
      getImage45: (): ImagePars => ({
        width: 6,
        height: 6,
        data: buff,
        extension: '.png',
        rotation: 45,
      }),
      getImage180: (): ImagePars => ({
        width: 6,
        height: 6,
        data: buff,
        extension: '.png',
        rotation: 180,
      }),
    },
  };
  expect(await createReport(opts, 'XML')).toMatchSnapshot();
});

it('010: can inject an image in a document that already contains images inserted during an earlier run by createReport (regression test for #259)', async () => {
  const template = await fs.promises.readFile(
    path.join(__dirname, 'fixtures', 'imageMultiDelimiter.docx')
  );
  const buff = await fs.promises.readFile(
    path.join(__dirname, 'fixtures', 'sample.png')
  );
  const reportA = await createReport({
    template,
    cmdDelimiter: '+++',
    data: {
      injectImg: () => ({
        width: 6,
        height: 6,
        data: buff,
        extension: '.png',
      }),
    },
  });

  expect(
    Object.keys((await JSZip.loadAsync(reportA))?.files ?? {}).filter(f =>
      f.includes('word/media')
    )
  ).toMatchInlineSnapshot(`
    [
      "word/media/",
      "word/media/template_document.xml_img1.png",
    ]
  `);

  const reportB = await createReport({
    template: reportA,
    cmdDelimiter: '---',
    data: {
      injectImg: () => ({
        width: 6,
        height: 6,
        data: buff,
        extension: '.png',
      }),
    },
  });

  expect(
    Object.keys((await JSZip.loadAsync(reportB))?.files ?? {}).filter(f =>
      f.includes('word/media')
    )
  ).toMatchInlineSnapshot(`
    [
      "word/media/",
      "word/media/template_document.xml_img1.png",
      "word/media/template_document.xml_img3.png",
    ]
  `);
});

it('011 correctly inserts the optional image caption', async () => {
  const template = await fs.promises.readFile(
    path.join(__dirname, 'fixtures', 'imageCaption.docx')
  );
  const buff = await fs.promises.readFile(
    path.join(__dirname, 'fixtures', 'sample.png')
  );
  const opts = {
    template,
    data: {},
    additionalJsContext: {
      injectImg: (caption: boolean) => {
        return {
          width: 6,
          height: 6,
          data: buff,
          extension: '.png',
          caption: caption ? 'The image caption!' : undefined,
        };
      },
    },
  };
  expect(await createReport(opts, 'XML')).toMatchSnapshot();
});

it('can inject image in document that already contained image with same extension but uppercase', async () => {
  const template = await fs.promises.readFile(
    path.join(__dirname, 'fixtures', 'existingUppercaseJPEGExtension.docx')
  );
  const buff = await fs.promises.readFile(
    path.join(__dirname, 'fixtures', 'sample.jpg')
  );

  const report = await createReport({
    template,
    cmdDelimiter: '+++',
    data: {
      injectImg: () => ({
        width: 6,
        height: 6,
        data: buff,
        extension: '.jpg',
      }),
    },
  });

  const jsZip = await JSZip.loadAsync(report);

  const contentType = await jsZip.file('[Content_Types].xml')?.async('string');

  expect(contentType).toBeDefined();
  expect(contentType).toMatchSnapshot();

  // For easy testing purpose
  // fs.writeFileSync('output.docx', report);
});
