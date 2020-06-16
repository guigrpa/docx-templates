import path from 'path';
import { zipLoad } from '../zip';
import { readContentTypes, getMainDoc } from '../main';
import fs from 'fs';
import { setDebugLogSink } from '../debug';

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
