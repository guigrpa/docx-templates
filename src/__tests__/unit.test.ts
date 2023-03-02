import path from 'path';
import { zipLoad } from '../zip';
import {
  readContentTypes,
  getMainDoc,
  getMetadata,
  parseTemplate,
} from '../main';
import fs from 'fs';
import { setDebugLogSink } from '../debug';
import { findHighestImgId } from '../processTemplate';

if (process.env.DEBUG) setDebugLogSink(console.log);

describe('[Content_Types].xml parser', () => {
  it('Correctly finds the main document xml file in a regular .docx file', async () => {
    const template = await fs.promises.readFile(
      path.join(__dirname, 'fixtures', 'simpleQuery.docx')
    );
    const zip = await zipLoad(template);
    const content_types = await readContentTypes(zip);
    const main_doc = getMainDoc(content_types);
    expect(main_doc).toStrictEqual('document.xml');
  });
  it('Correctly finds the main document xml file in an Office365 .docx file', async () => {
    const template = await fs.promises.readFile(
      path.join(__dirname, 'fixtures', 'office365.docx')
    );
    const zip = await zipLoad(template);
    const content_types = await readContentTypes(zip);
    const main_doc = getMainDoc(content_types);
    expect(main_doc).toStrictEqual('document2.xml');
  });
});

describe('getMetadata', () => {
  it('finds the number of pages', async () => {
    const template = await fs.promises.readFile(
      path.join(__dirname, 'fixtures', 'simpleQuery.docx')
    );
    expect(await getMetadata(template)).toMatchInlineSnapshot(`
      {
        "category": undefined,
        "characters": 24,
        "company": undefined,
        "created": "2015-08-16T18:55:00Z",
        "creator": "Unga Graorg",
        "description": undefined,
        "lastModifiedBy": "Grau Panea, Guillermo",
        "lastPrinted": undefined,
        "lines": 1,
        "modified": "2016-12-15T11:21:00Z",
        "pages": 1,
        "paragraphs": 1,
        "revision": "32",
        "subject": undefined,
        "template": "Normal.dotm",
        "title": undefined,
        "words": 4,
      }
    `);
  });

  it('smoke test: does not crash on normal docx files', async () => {
    expect.hasAssertions();
    const files = await fs.promises.readdir(
      path.join(__dirname, 'fixtures'),
      'utf-8'
    );
    for (const f of files) {
      if (f.startsWith('~$') || !f.endsWith('.docx')) continue;
      const t = await fs.promises.readFile(path.join(__dirname, 'fixtures', f));
      const metadata = await getMetadata(t);
      expect(typeof metadata.modified).toBe('string');
    }
  });
});

describe('findHighestImgId', () => {
  it('returns 0 when doc contains no images', async () => {
    const template = await fs.promises.readFile(
      path.join(__dirname, 'fixtures', 'imageExistingMultiple.docx')
    );
    const { jsTemplate } = await parseTemplate(template);
    expect(findHighestImgId(jsTemplate)).toBe(3);
  });
});
