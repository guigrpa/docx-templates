/* eslint-env jest */

import path from 'path';
import fs from 'fs';
import MockDate from 'mockdate';
import QR from 'qrcode';
import { createReport } from '../index';
import { UserOptions } from '../types';
import { setDebugLogSink } from '../debug';
import JSZip from 'jszip';

if (process.env.DEBUG) setDebugLogSink(console.log);

const LONG_TEXT = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed commodo sagittis erat, sed vehicula lorem molestie et. Sed eget nisi orci. Fusce ut scelerisque neque. Donec porta eleifend dolor. Morbi in egestas augue. Nunc non velit at nisl faucibus ultrices. Aenean ac lacinia tortor. Nunc elementum enim ut viverra maximus. Pellentesque et metus posuere, feugiat nulla in, feugiat mauris. Suspendisse eu urna aliquam, molestie ante at, convallis justo.
Nullam hendrerit quam sit amet nunc tincidunt dictum. Praesent hendrerit at quam ac fermentum. Donec rutrum enim lacus, mollis imperdiet ex posuere ac. Sed vel ullamcorper massa. Duis non posuere mauris. Etiam purus turpis, fermentum a rhoncus et, rutrum in nisl. Aliquam pharetra sit amet lectus sed bibendum. Sed sem ipsum, placerat a nisl vitae, pharetra mattis libero. Nunc finibus purus id consectetur sagittis. Pellentesque ornare egestas lacus, in blandit diam facilisis eget. Morbi nec ligula id ligula tincidunt tincidunt vulputate id erat. Quisque ut eros et sem pharetra placerat a vel leo. Praesent accumsan neque imperdiet, facilisis ipsum interdum, aliquam mi. Sed posuere purus eu sagittis aliquam.\n
Morbi dignissim consequat ex, non finibus est faucibus sodales. Integer sed justo mollis, fringilla ipsum tempor, laoreet elit. Nullam iaculis finibus nulla a commodo. Curabitur nec suscipit velit, vitae lobortis mauris. Integer ac bibendum quam, eget pretium justo. Ut finibus, sem sed pharetra dictum, metus mauris tristique justo, sed congue erat mi a leo. Aliquam dui arcu, gravida quis magna ac, volutpat blandit felis. Morbi quis lobortis tortor. Cras pulvinar feugiat metus nec commodo. Sed sollicitudin risus vel risus finibus, sit amet pretium sapien fermentum. Nulla accumsan ullamcorper felis, quis tempor dolor. Praesent blandit ullamcorper pretium. Ut viverra molestie dui.`;

['noSandbox', 'sandbox'].forEach(sbStatus => {
  const noSandbox = sbStatus === 'sandbox' ? false : true;

  describe(`${sbStatus}`, () => {
    describe('Template processing', () => {
      beforeEach(() => {
        // Set a global fixed Date. Some tests check the zip contents,
        // and the zip contains the date
        MockDate.set('1/1/2000');
      });
      afterEach(() => {
        MockDate.reset();
      });

      it('01 Probe works', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'noQuery.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
          },
          'JS'
        );
        expect(result._children.length).toBeTruthy();
      });

      it('02 Extracts a query and calls the resolver', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'simpleQuery.docx')
        );
        const queryResolver = jest.fn();
        const queryVars = { a: 'importantContext' };
        await createReport(
          {
            noSandbox,
            template,
            data: queryResolver,
            queryVars,
          },
          'JS'
        );
        expect(queryResolver.mock.calls.length).toEqual(1);
        expect(queryResolver.mock.calls[0][0]).toEqual('exampleQuery');
        expect(queryResolver.mock.calls[0][1]).toEqual(queryVars);
      });

      it("03 Uses the resolver's response to produce the report", async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'simpleQuerySimpleInserts.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
            data: () => ({ a: 'foo', b: 'bar' }),
          },
          'JS'
        );
        expect(result).toMatchSnapshot();
      });

      it('04 Allows replacing the resolver by a data object', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'noQuerySimpleInserts.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
            data: { a: 'foo', b: 'bar' },
          },
          'JS'
        );
        expect(result).toMatchSnapshot();
      });

      it('04b Allows custom left-right delimiters', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'noQueryBrackets.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
            data: { a: 'foo', b: 'bar' },
            cmdDelimiter: ['{', '}'],
          },
          'JS'
        );
        expect(result).toMatchSnapshot();
      });

      it('Processes INS command in watermark', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'watermarked.docx')
        );
        const data = { companyName: 'Windsurf Inc.' };
        const report = await createReport({
          noSandbox,
          template,
          data,
          cmdDelimiter: ['+++', '+++'],
        });

        const zip = await JSZip.loadAsync(report);

        // --- Debug Snapshot Start ---
        // Snapshot a common header file to see its content post-processing.
        let actualDebugContentForSnapshot =
          'Neither word/headerdefault.xml nor word/header1.xml found for debug snapshot.';
        let snapshotNameForDebug = 'debug_header_not_found';

        const defaultHeaderFile = zip.file('word/headerdefault.xml');
        if (defaultHeaderFile) {
          actualDebugContentForSnapshot = await defaultHeaderFile.async(
            'string'
          );
          snapshotNameForDebug = 'debug_raw_word_headerdefault_xml';
        } else {
          const header1File = zip.file('word/header1.xml');
          if (header1File) {
            actualDebugContentForSnapshot = await header1File.async('string');
            snapshotNameForDebug = 'debug_raw_word_header1_xml';
          }
        }
        expect(actualDebugContentForSnapshot).toMatchSnapshot(
          snapshotNameForDebug
        );
        // --- Debug Snapshot End ---

        const headerFilesToCheck = [
          'word/header1.xml', // Common/default
          'word/header2.xml',
          'word/header3.xml',
          'word/headerdefault.xml', // Explicit default header
          'word/headerfirst.xml', // First page header
          'word/headereven.xml', // Even page header
        ];

        let foundHeaderContent: string | undefined;
        let foundHeaderName: string | undefined;

        for (const headerFile of headerFilesToCheck) {
          const file = zip.file(headerFile);
          if (file) {
            const currentHeaderContent = await file.async('string');
            if (currentHeaderContent.includes('Windsurf Inc.')) {
              foundHeaderContent = currentHeaderContent;
              foundHeaderName = headerFile;
              break; // Found the relevant header
            }
          }
        }

        // Assert that a header containing the watermark was found
        expect(foundHeaderContent).toBeDefined();
        // Assert that the found content indeed contains the processed text
        // Note: TypeScript might complain foundHeaderContent could be undefined here if expect above wasn't enough.
        // We can add a check or use a non-null assertion operator if needed, but expect should fail first.
        expect(foundHeaderContent).toContain('Windsurf Inc.');

        // Take a snapshot of the found header content
        // The foundHeaderName will be undefined if the loop didn't find anything, but expect(foundHeaderContent).toBeDefined() should catch that.
        expect(foundHeaderContent).toMatchSnapshot(
          `watermark in ${foundHeaderName?.replace(/\//g, '_')}`
        );
      });

      it('05 Processes 1-level FOR loops', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'for1.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
            data: {
              companies: [
                { name: 'FIRST' },
                { name: 'SECOND' },
                { name: 'THIRD' },
              ],
            },
          },
          'JS'
        );
        expect(result).toMatchSnapshot();
      });

      it('06 Processes 2-level FOR loops', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'for2.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
            data: {
              companies: [
                {
                  name: 'FIRST',
                  people: [{ firstName: 'Pep' }, { firstName: 'Fidel' }],
                },
                {
                  name: 'SECOND',
                  people: [{ firstName: 'Albert' }, { firstName: 'Xavi' }],
                },
              ],
            },
          },
          'JS'
        );
        expect(result).toMatchSnapshot();
      });

      it('07 Processes 3-level FOR loops', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'for3.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
            data: {
              companies: [
                {
                  name: 'FIRST',
                  people: [
                    {
                      firstName: 'Pep',
                      projects: [{ name: 'one' }, { name: 'two' }],
                    },
                    { firstName: 'Fidel', projects: [{ name: 'three' }] },
                  ],
                },
                {
                  name: 'SECOND',
                  people: [
                    { firstName: 'Albert', projects: [] },
                    { firstName: 'Xavi', projects: [] },
                  ],
                },
                {
                  name: 'THIRD',
                  people: [],
                },
              ],
            },
          },
          'JS'
        );
        expect(result).toMatchSnapshot();
      });

      it('08 Processes 1-level FOR-ROW loops', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'for-row1.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
            data: {
              companies: [
                { name: 'FIRST' },
                { name: 'SECOND' },
                { name: 'THIRD' },
              ],
            },
          },
          'JS'
        );
        expect(result).toMatchSnapshot();
      });

      it('08b Processes 1-level IF-ROW loops', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'if-row1.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
          },
          'JS'
        );
        expect(result).toMatchSnapshot();
      });

      it('09 Allows scalar arrays in FOR loops', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'for1scalars.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
            data: { companies: ['FIRST', 'SECOND', 'THIRD'] },
          },
          'JS'
        );
        expect(result).toMatchSnapshot();
      });

      it('10 Processes JS snippets to get the array elements', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'for1js.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
            data: {
              companies: [
                { name: 'abengoa' },
                { name: 'Endesa' },
                { name: 'IBERDROLA' },
                { name: 'Acerinox' },
              ],
            },
          },
          'JS'
        );
        expect(result).toMatchSnapshot();
      });

      it('11 Processes inline FOR loops', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'for1inline.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
            data: {
              companies: [
                { name: 'FIRST' },
                { name: 'SECOND' },
                { name: 'THIRD' },
              ],
            },
          },
          'JS'
        );
        expect(result).toMatchSnapshot();
      });

      it('12 Processes a more complex inline FOR loop with spaces', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'for1inlineWithSpaces.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
            data: {
              companies: [
                { name: 'FIRST' },
                { name: 'SECOND' },
                { name: 'THIRD' },
              ],
            },
          },
          'JS'
        );
        expect(result).toMatchSnapshot();
      });

      it('13a Processes 1-level IF', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'if.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
          },
          'JS'
        );
        expect(result).toMatchSnapshot();
      });

      it('13b Processes 2-level IF', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'if2.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
          },
          'JS'
        );
        expect(result).toMatchSnapshot();
      });

      it('13j Processes inline IF', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'ifInline.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
          },
          'JS'
        );
        expect(result).toMatchSnapshot();
      });

      it('20 Processes ALIAS commands', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'for1alias.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
            data: {
              companies: [
                { name: 'FIRST' },
                { name: 'SECOND' },
                { name: 'THIRD' },
              ],
            },
          },
          'JS'
        );
        expect(result).toMatchSnapshot();
      });

      it('22 Allows accented characters and such', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'for1.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
            data: {
              companies: [{ name: '¿Por qué?' }, { name: 'Porque sí' }],
            },
          },
          'JS'
        );
        expect(result).toMatchSnapshot();
      });

      it('23 Allows characters that conflict with XML', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'for1.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
            data: {
              companies: [
                { name: '3 < 4 << 400' },
                { name: '5 > 2 >> -100' },
                { name: 'a & b && c' },
              ],
            },
          },
          'XML'
        );
        expect(result).toMatchSnapshot();
      });

      it('23b Allows insertion of literal XML', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'literalXml.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
            data: { text: 'foo||<w:br/>||bar' },
          },
          'XML'
        );
        expect(result).toMatchSnapshot();
      });

      it('23c Allows insertion of literal XML with custom delimiter', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'literalXml.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
            data: { text: 'foo____<w:br/>____bar' },
            literalXmlDelimiter: '____',
          },
          'XML'
        );
        expect(result).toMatchSnapshot();
      });

      it('24 Allows Word to split commands arbitrarily, incl. delimiters', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'splitDelimiters.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
            data: { foo: 'bar' },
          },
          'JS'
        );
        expect(result).toMatchSnapshot();
      });

      it('25 Adds line breaks by default', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'longText.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
            data: { longText: LONG_TEXT },
          },
          'XML'
        );
        expect(result).toMatchSnapshot();
      });

      it('25b Allows disabling line break processing', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'longText.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
            data: { longText: LONG_TEXT },
            processLineBreaks: false,
          },
          'XML'
        );
        expect(result).toMatchSnapshot();
      });

      it('30 Processes simple JS snippets in an INS', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'insJsSimple.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
          },
          'JS'
        );
        expect(result).toMatchSnapshot();
      });

      it('31 Processes more complex JS snippets in an INS', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'insJsComplex.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
            data: { companies: ['FIRST', 'SECOND', 'THIRD'] },
          },
          'JS'
        );
        expect(result).toMatchSnapshot();
      });

      it('32 Provides access to loop indices (JS)', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'insJsWithLoops.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
            data: {
              companies: [
                { name: 'FIRST' },
                { name: 'SECOND' },
                { name: 'THIRD' },
              ],
            },
          },
          'JS'
        );
        expect(result).toMatchSnapshot();
      });

      it('33 Processes EXEC commands (JS)', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'exec.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
            data: {},
          },
          'JS'
        );
        expect(result).toMatchSnapshot();
      });

      it('33b Processes EXEC with shorthand (!)', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'execShorthand.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
            data: {},
          },
          'JS'
        );
        expect(result).toMatchSnapshot();
      });

      it('33c Processes EXEC when a promise is returned', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'execPromise.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
            data: {},
          },
          'JS'
        );
        expect(result).toMatchSnapshot();
      });

      it('34 Processes INS with shorthand (=)', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'insShorthand.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
            data: {
              companies: [
                { name: 'FIRST' },
                { name: 'SECOND' },
                { name: 'THIRD' },
              ],
            },
          },
          'JS'
        );
        expect(result).toMatchSnapshot();
      });

      it('34b Processes INS omitting the command name', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'insOmitted.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
            data: {
              companies: [
                { name: 'FIRST' },
                { name: 'SECOND' },
                { name: 'THIRD' },
              ],
            },
          },
          'JS'
        );
        expect(result).toMatchSnapshot();
      });

      it('35 Processes all snippets in the same sandbox', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'execAndIns.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
            data: {
              companies: [
                { name: 'FIRST' },
                { name: 'SECOND' },
                { name: 'THIRD' },
              ],
            },
          },
          'JS'
        );
        expect(result).toMatchSnapshot();
      });

      it('36 Processes all snippets without sandbox', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'execAndIns.docx')
        );
        const result = await createReport(
          {
            template,
            noSandbox: true,
            data: {
              companies: [
                { name: 'FIRST' },
                { name: 'SECOND' },
                { name: 'THIRD' },
              ],
            },
          },
          'JS'
        );
        expect(result).toMatchSnapshot();
      });

      it('36b Processes a snippet with additional context', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'execWithContext.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
            data: {
              companies: [
                { name: 'FIRST' },
                { name: 'SECOND' },
                { name: 'THIRD' },
              ],
            },
            additionalJsContext: {
              toLowerCase: (str: string) => str.toLowerCase(),
            },
          },
          'JS'
        );
        expect(result).toMatchSnapshot();
      });

      it('38b Processes IMAGE commands with base64 data', async () => {
        MockDate.set('1/1/2000');
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'imageBase64.docx')
        );
        const options: UserOptions = {
          noSandbox,
          template,
          data: {},
          additionalJsContext: {
            qr: async (contents: string) => {
              const dataUrl = await QR.toDataURL(contents, { width: 500 });
              const data = dataUrl.slice('data:image/gif;base64,'.length);
              return { width: 6, height: 6, data, extension: '.gif' };
            },
          },
        };
        const result = await createReport(options, 'JS');
        expect(result).toMatchSnapshot();
      });

      it('38c Processes IMAGE commands with alt text', async () => {
        MockDate.set('1/1/2000');
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'imageBase64.docx')
        );
        const options = {
          noSandbox,
          template,
          data: {},
          additionalJsContext: {
            qr: async (contents: string) => {
              const dataUrl = await QR.toDataURL(contents, { width: 500 });
              const data = dataUrl.slice('data:image/gif;base64,'.length);
              return {
                width: 6,
                height: 6,
                data,
                extension: '.gif',
                alt: `qr code for ${contents}`,
              };
            },
          },
        };
        const result = await createReport(options, 'JS');
        expect(result).toMatchSnapshot();
      });

      it('39 Processes LINK commands', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'links.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
            data: {},
          },
          'JS'
        );
        expect(result).toMatchSnapshot();
      });

      it('3A Processes HTML commands', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'htmls.docx')
        );
        const opts = {
          noSandbox,
          template,
          data: {},
        };
        expect(await createReport(opts, 'JS')).toMatchSnapshot();

        // Check the name of the HTML file in the resulting docx.
        const zip = await JSZip.loadAsync(await createReport(opts));
        expect(Object.keys(zip?.files ?? {})).toStrictEqual([
          '[Content_Types].xml',
          '_rels/.rels',
          'word/_rels/document.xml.rels',
          'word/document.xml',
          'word/theme/theme1.xml',
          'docProps/thumbnail.emf',
          'word/settings.xml',
          'word/fontTable.xml',
          'word/webSettings.xml',
          'docProps/core.xml',
          'word/styles.xml',
          'docProps/app.xml',
          'word/',
          'word/template_document_xml_html1.html',
          'word/template_document_xml_html2.html',
          'word/_rels/',
        ]);
      });

      it('40 Throws on invalid command', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'invalidCommand.docx')
        );
        return expect(
          createReport(
            {
              noSandbox,
              template,
              data: {
                companies: [
                  { name: 'FIRST' },
                  { name: 'SECOND' },
                  { name: 'THIRD' },
                ],
              },
            },
            'JS'
          )
        ).rejects.toMatchSnapshot();
      });

      it('41 Throws on invalid for logic', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'invalidFor.docx')
        );
        return expect(
          createReport(
            {
              noSandbox,
              template,
              data: {
                companies: [
                  { name: 'FIRST' },
                  { name: 'SECOND' },
                  { name: 'THIRD' },
                ],
                persons: [{ name: 'johnny' }],
              },
            },
            'JS'
          )
        ).rejects.toMatchSnapshot();
      });

      it('41b Throws on invalid if logic (bad nesting)', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'invalidIf.docx')
        );
        return expect(
          createReport(
            {
              noSandbox,
              template,
              data: {
                companies: [
                  { name: 'FIRST' },
                  { name: 'SECOND' },
                  { name: 'THIRD' },
                ],
              },
            },
            'JS'
          )
        ).rejects.toMatchSnapshot();
      });

      it('70 Allows customisation of cmd delimiter', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'for1customDelimiter.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
            data: {
              companies: [
                { name: 'FIRST' },
                { name: 'SECOND' },
                { name: 'THIRD' },
              ],
            },
            cmdDelimiter: '***',
          },
          'JS'
        );
        expect(result).toMatchSnapshot();
      });

      it('80 Copes with a more complex example: WBS', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'wbs.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
            data: {
              project: {
                name: 'docx-templates',
                workPackages: [
                  {
                    acronym: 'WP1',
                    title: 'Work Package 1',
                    startMilestone: { acronym: 'M1', plannedDelta: '0 m' },
                    endMilestone: { acronym: 'M2', plannedDelta: '2 m' },
                    leaderCompany: { acronym: 'me' },
                  },
                  {
                    acronym: 'WP2',
                    title: 'Work Package 2',
                    startMilestone: { acronym: 'M2', plannedDelta: '2 m' },
                    endMilestone: { acronym: 'M3', plannedDelta: '4 m' },
                    leaderCompany: {},
                  },
                ],
              },
            },
          },
          'JS'
        );
        expect(result).toMatchSnapshot();
      });

      it('83 LINK inside FOR loop: regression test for issue #83', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'link-regression-issue-83.docx')
        );

        const opts = {
          noSandbox,
          template,
          data: {
            companies: [
              {
                name: 'FIRST',
              },
              {
                name: 'SECOND',
              },
            ],
          },
        };

        // Render to an object and compare with snapshot.
        expect(await createReport(opts, 'JS')).toMatchSnapshot();
      });

      it('regression test for issue #133 (and #83): LINK inside FOR loop', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'link-regression-issue-133.docx')
        );

        const opts = {
          noSandbox,
          template,
          data: {
            links: [
              { url: 'https://www.google.com/', name: 'Google' },
              { url: 'https://www.youtube.com/', name: 'Youtube' },
            ],
          },
        };

        // Render to an object and compare with snapshot.
        expect(await createReport(opts, 'JS')).toMatchSnapshot();
      });

      it('112a failFast: false lists all errors in the document before failing.', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'invalidMultipleErrors.docx')
        );
        return expect(
          createReport(
            {
              noSandbox,
              template,
              data: {
                companies: [
                  { name: 'FIRST' },
                  { name: 'SECOND' },
                  { name: 'THIRD' },
                ],
              },
              failFast: false,
            },
            'JS'
          )
        ).rejects.toMatchSnapshot();
      });

      it('112b failFast: true has the same behaviour as when failFast is undefined', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'invalidMultipleErrors.docx')
        );
        return expect(
          createReport(
            {
              noSandbox,
              template,
              data: {
                companies: [
                  { name: 'FIRST' },
                  { name: 'SECOND' },
                  { name: 'THIRD' },
                ],
              },
              failFast: true,
            },
            'JS'
          )
        ).rejects.toMatchSnapshot();
      });

      it('avoids confusion between variable name and built-in command', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'confusingCommandNames.docx')
        );
        const opts = {
          noSandbox,
          template,
          data: {
            something: 'should show up 1',
            INSertable: 'should show up 2',
            companies: [
              { name: 'FIRST' },
              { name: 'SECOND' },
              { name: 'THIRD' },
            ],
          },
          additionalJsContext: { formatNumber: (n: number) => n.toFixed() },
        };

        // Render to an object and compare with snapshot.
        expect(await createReport(opts, 'JS')).toMatchSnapshot();
      });

      it('107a non-alphanumeric INS commands (e.g. Chinese)', async () => {
        // Issue #107.
        const data = {
          姓名: 'hong',
          标题: 'junyao',
        };
        expect(
          await createReport(
            {
              noSandbox,
              template: await fs.promises.readFile(
                path.join(__dirname, 'fixtures', 'nonAlphaCommandNames1.docx')
              ),
              data,
            },
            'JS'
          )
        ).toMatchSnapshot();
      });

      it('107b non-alphanumeric INS commands (e.g. Chinese) with custom delimiter', async () => {
        // Issue #107.
        const data = {
          姓名: 'hong',
          标题: 'junyao',
        };
        expect(
          await createReport(
            {
              noSandbox,
              template: await fs.promises.readFile(
                path.join(__dirname, 'fixtures', 'nonAlphaCommandNames2.docx')
              ),
              data,
              cmdDelimiter: ['{', '}'],
            },
            'JS'
          )
        ).toMatchSnapshot();
      });

      it('131 correctly handles Office 365 .docx files', async () => {
        // These files tend to contain a differently named document.xml (like document2.xml)
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'office365.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
            data: {
              test: 'first value!',
              test2: 'second value!',
            },
            failFast: true,
            cmdDelimiter: ['{', '}'],
          },
          'JS'
        );
        expect(result).toMatchSnapshot();
      });

      it('iterate over object properties and keys in FOR loop', async () => {
        // Example to answer question posed in issue #149
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'forOverObjectKeys.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
            data: {
              companies: {
                one: 'FIRST',
                two: 'SECOND',
                three: 'THIRD',
              },
            },
          },
          'JS'
        );
        expect(result).toMatchSnapshot();
      });

      it('fixSmartQuotes flag (see PR #152)', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'fixSmartQuotes.docx')
        );

        // The default behaviour should return an error when smart quotes (curly quotes) are present in the command,
        // as the command isn't valid javascript.
        await expect(
          createReport({
            noSandbox,
            template,
            data: {},
          })
        ).rejects.toThrowErrorMatchingSnapshot();

        // Unless we use our superpower: the fixSmartQuotes flag!
        const result = await createReport(
          {
            noSandbox,
            template,
            data: {},
            fixSmartQuotes: true,
          },
          'XML'
        );
        expect(result.includes('enigrebua')).toBeTruthy(); // the word aubergine in reverse
      });

      it('works with macro-enabled (docm) templates', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'macroEnabledTemplate.docm')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
            data: {},
          },
          'JS'
        );
        expect(result).toMatchSnapshot();
      });

      it('INS command is an array (see issue #214)', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'insertArray.docx')
        );
        expect(
          await createReport(
            {
              noSandbox,
              template,
              data: {
                companies: ['a', 'b', 'c'],
              },
            },
            'JS'
          )
        ).toMatchSnapshot();
      });

      it('HTML in table (see PR #233)', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'tableWithHTML.docx')
        );
        expect(
          await createReport(
            {
              noSandbox,
              template,
              data: {},
            },
            'XML'
          )
        ).toMatchSnapshot();
      });

      it('INS in header and footer', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'insertInHeaderAndFooter.docx')
        );
        expect(
          await createReport(
            {
              noSandbox,
              template,
              data: {
                body_command: 'this goes into the body',
                header_command: 'this goes into the header',
                footer_command: 'this goes into the footer',
              },
            },
            'XML'
          )
        ).toMatchSnapshot();
      });

      it('treats existing text near nested FOR loops correctly', async () => {
        const template = await fs.promises.readFile(
          path.join(
            __dirname,
            'fixtures',
            'nestedInlineForLoopWithSurroundingText.docx'
          )
        );
        const opts: UserOptions = {
          noSandbox,
          template,
          cmdDelimiter: '+++',
          data: {
            companies: [{ name: 'company_A' }, { name: 'company_B' }],
            products: [{ name: 'product1' }, { name: 'product2' }],
          },
        };
        expect(await createReport(opts, 'XML')).toMatchSnapshot();
      });

      it('newline character inside variable issue #143 not rendered properly in LibreOffice/GDrive', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'newlineInVariableIssue143.docx')
        );
        const headline = 'I am a line\n\nAnd so am I!';
        const opts = {
          template,
          data: {
            headline: headline,
          },
          processLineBreaksAsNewText: true,
        };
        expect(await createReport(opts, 'XML')).toMatchSnapshot();
      });

      it('Processes FOR loops with Text Box', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'forLoopWithTextBox.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
            data: {
              companies: [
                { name: 'FIRST' },
                { name: 'SECOND' },
                { name: 'THIRD' },
              ],
            },
          },
          'JS'
        );
        expect(result).toMatchSnapshot();
      });

      it('Access current element index from FOR loop', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'forWithIdx.docx')
        );
        const opts: UserOptions = {
          noSandbox,
          template,
          failFast: true,
          rejectNullish: true,
          data: {
            companies: [
              { name: 'MEGACORP', executives: ['Excellent CEO', 'Someone'] },
              { name: 'SUPERCORP', executives: ['John Smith'] },
              { name: 'ULTRACORP', executives: ['Who else', "Can't be me"] },
            ],
          },
        };
        const result = await createReport(opts, 'XML');
        expect(result).toMatchSnapshot();
      });

      it('Nested IF statements on same line', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'ifStatementsOnSameLine.docx')
        );

        const result = createReport(
          {
            noSandbox,
            template,
            data: { a: true, b: true, counts: ['a', 'b', 'c'] },
            cmdDelimiter: ['{{', '}}'],
          },
          'JS'
        );
        return expect(result).rejects.toMatchSnapshot();
      });

      it('Nested IF statements on same row1', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'ifStatementsOnSameRow1.docx')
        );

        const result = createReport(
          {
            noSandbox,
            template,
            data: { a: true, b: true, counts: ['a', 'b', 'c'] },
            cmdDelimiter: ['{{', '}}'],
          },
          'JS'
        );
        return expect(result).rejects.toMatchSnapshot();
      });

      it('Nested IF statements on same row2', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'ifStatementsOnSameRow2.docx')
        );

        const result = createReport(
          {
            noSandbox,
            template,
            data: { a: true, b: true, counts: ['a', 'b', 'c'] },
            cmdDelimiter: ['{{', '}}'],
          },
          'JS'
        );
        return expect(result).rejects.toMatchSnapshot();
      });

      it('Dynamic table columns', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'dynamic-columns.docx')
        );
        const result = await createReport(
          {
            noSandbox,
            template,
            data: {
              columns: ['Column 1', 'Column 2', 'Column 3'],
            },
          },
          'XML'
        );
        expect(result).toMatchSnapshot();
      });

      it('Dynamic table columns with dynamic rows', async () => {
        const template = await fs.promises.readFile(
          path.join(
            __dirname,
            'fixtures',
            'dynamic-columns-with-dynamic-rows.docx'
          )
        );
        const result = await createReport(
          {
            noSandbox,
            template,
            data: {
              rows: ['Row 1', 'Row 2', 'Row 3'],
              columns: ['Column 1', 'Column 2', 'Column 3'],
            },
          },
          'XML'
        );
        expect(result).toMatchSnapshot();
      });
    });
  });
});
