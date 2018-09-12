/* eslint-env jest */

import path from 'path';
import fs from 'fs-extra';
import MockDate from 'mockdate';
import md5 from 'md5';
import { set as timmSet } from 'timm';
import qrcode from 'yaqrcode';

// SWUT
import createReport from '../indexNode';
import createReportBrowser from '../indexBrowser';

const outputDir = path.join(__dirname, 'out');
const WRITE_REPORTS_TO_FILE = false;

const LONG_TEXT = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed commodo sagittis erat, sed vehicula lorem molestie et. Sed eget nisi orci. Fusce ut scelerisque neque. Donec porta eleifend dolor. Morbi in egestas augue. Nunc non velit at nisl faucibus ultrices. Aenean ac lacinia tortor. Nunc elementum enim ut viverra maximus. Pellentesque et metus posuere, feugiat nulla in, feugiat mauris. Suspendisse eu urna aliquam, molestie ante at, convallis justo.
Nullam hendrerit quam sit amet nunc tincidunt dictum. Praesent hendrerit at quam ac fermentum. Donec rutrum enim lacus, mollis imperdiet ex posuere ac. Sed vel ullamcorper massa. Duis non posuere mauris. Etiam purus turpis, fermentum a rhoncus et, rutrum in nisl. Aliquam pharetra sit amet lectus sed bibendum. Sed sem ipsum, placerat a nisl vitae, pharetra mattis libero. Nunc finibus purus id consectetur sagittis. Pellentesque ornare egestas lacus, in blandit diam facilisis eget. Morbi nec ligula id ligula tincidunt tincidunt vulputate id erat. Quisque ut eros et sem pharetra placerat a vel leo. Praesent accumsan neque imperdiet, facilisis ipsum interdum, aliquam mi. Sed posuere purus eu sagittis aliquam.
Morbi dignissim consequat ex, non finibus est faucibus sodales. Integer sed justo mollis, fringilla ipsum tempor, laoreet elit. Nullam iaculis finibus nulla a commodo. Curabitur nec suscipit velit, vitae lobortis mauris. Integer ac bibendum quam, eget pretium justo. Ut finibus, sem sed pharetra dictum, metus mauris tristique justo, sed congue erat mi a leo. Aliquam dui arcu, gravida quis magna ac, volutpat blandit felis. Morbi quis lobortis tortor. Cras pulvinar feugiat metus nec commodo. Sed sollicitudin risus vel risus finibus, sit amet pretium sapien fermentum. Nulla accumsan ullamcorper felis, quis tempor dolor. Praesent blandit ullamcorper pretium. Ut viverra molestie dui.`;

const reportConfigs = {
  noSandbox: { noSandbox: true },
  sandbox: { noSandbox: false },
  vm2Sandbox: { vm2Sandbox: true },
};

['noSandbox', 'sandbox', 'vm2Sandbox'].forEach(type => {
  const reportConfig = reportConfigs[type];

  describe(type, () => {
    describe('End-to-end', () => {
      beforeEach(async () => {
        await fs.remove(outputDir);
      });
      afterEach(async () => {
        await fs.remove(outputDir);
      });

      it('01 Copies (unchanged) a template without markup', async () => {
        const template = path.join(__dirname, 'fixtures', 'noQuery.docx');
        const output = path.join(outputDir, 'noQuery_report.docx');
        await createReport({ ...reportConfig, template, output });
        expect(fs.existsSync(output)).toBeTruthy();
      });

      it('02 Can produce a default output path', async () => {
        const template = path.join(__dirname, 'fixtures', 'noQuery.docx');
        const defaultOutput = path.join(
          __dirname,
          'fixtures',
          'noQuery_report.docx'
        );
        await createReport({ ...reportConfig, template });
        expect(fs.existsSync(defaultOutput)).toBeTruthy();
        fs.unlinkSync(defaultOutput);
      });
    });

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
        const template = path.join(__dirname, 'fixtures', 'noQuery.docx');
        const defaultOutput = path.join(
          __dirname,
          'fixtures',
          'noQuery_report.docx'
        );
        const result = await createReport({
          ...reportConfig,
          template,
          _probe: 'JS',
        });
        expect(fs.existsSync(defaultOutput)).toBeFalsy();
        expect(result._children.length).toBeTruthy();
      });

      it('02 Extracts a query and calls the resolver', async () => {
        const template = path.join(__dirname, 'fixtures', 'simpleQuery.docx');
        const queryResolver = jest.fn();
        const queryVars = { a: 'importantContext' };
        await createReport({
          ...reportConfig,
          template,
          data: queryResolver,
          queryVars,
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
        });
        expect(queryResolver.mock.calls.length).toEqual(1);
        expect(queryResolver.mock.calls[0][0]).toEqual('exampleQuery');
        expect(queryResolver.mock.calls[0][1]).toEqual(queryVars);
      });

      it("03 Uses the resolver's response to produce the report", async () => {
        const template = path.join(
          __dirname,
          'fixtures',
          'simpleQuerySimpleInserts.docx'
        );
        const result = await createReport({
          ...reportConfig,
          template,
          data: () => ({ a: 'foo', b: 'bar' }),
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
        });
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
      });

      it('04 Allows replacing the resolver by a data object', async () => {
        const template = path.join(
          __dirname,
          'fixtures',
          'noQuerySimpleInserts.docx'
        );
        const result = await createReport({
          ...reportConfig,
          template,
          data: { a: 'foo', b: 'bar' },
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
        });
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
      });

      it('05 Processes 1-level FOR loops', async () => {
        const template = path.join(__dirname, 'fixtures', 'for1.docx');
        const result = await createReport({
          ...reportConfig,
          template,
          data: {
            companies: [
              { name: 'FIRST' },
              { name: 'SECOND' },
              { name: 'THIRD' },
            ],
          },
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
        });
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
      });

      it('06 Processes 2-level FOR loops', async () => {
        const template = path.join(__dirname, 'fixtures', 'for2.docx');
        const result = await createReport({
          ...reportConfig,
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
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
        });
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
      });

      it('07 Processes 3-level FOR loops', async () => {
        const template = path.join(__dirname, 'fixtures', 'for3.docx');
        const result = await createReport({
          ...reportConfig,
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
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
        });
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
      });

      it('08 Processes 1-level FOR-ROW loops', async () => {
        const template = path.join(__dirname, 'fixtures', 'for-row1.docx');
        const result = await createReport({
          ...reportConfig,
          template,
          data: {
            companies: [
              { name: 'FIRST' },
              { name: 'SECOND' },
              { name: 'THIRD' },
            ],
          },
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
        });
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
      });

      it('08b Processes 1-level IF-ROW loops', async () => {
        const template = path.join(__dirname, 'fixtures', 'if-row1.docx');
        const result = await createReport({
          ...reportConfig,
          template,
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
        });
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
      });

      it('09 Allows scalar arrays in FOR loops', async () => {
        const template = path.join(__dirname, 'fixtures', 'for1scalars.docx');
        const result = await createReport({
          ...reportConfig,
          template,
          data: { companies: ['FIRST', 'SECOND', 'THIRD'] },
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
        });
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
      });

      it('10 Processes JS snippets to get the array elements', async () => {
        const template = path.join(__dirname, 'fixtures', 'for1js.docx');
        const result = await createReport({
          ...reportConfig,
          template,
          data: {
            companies: [
              { name: 'abengoa' },
              { name: 'Endesa' },
              { name: 'IBERDROLA' },
              { name: 'Acerinox' },
            ],
          },
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
        });
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
      });

      it('11 Processes inline FOR loops', async () => {
        const template = path.join(__dirname, 'fixtures', 'for1inline.docx');
        const result = await createReport({
          ...reportConfig,
          template,
          data: {
            companies: [
              { name: 'FIRST' },
              { name: 'SECOND' },
              { name: 'THIRD' },
            ],
          },
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
        });
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
      });

      it('12 Processes a more complex inline FOR loop with spaces', async () => {
        const template = path.join(
          __dirname,
          'fixtures',
          'for1inlineWithSpaces.docx'
        );
        const result = await createReport({
          ...reportConfig,
          template,
          data: {
            companies: [
              { name: 'FIRST' },
              { name: 'SECOND' },
              { name: 'THIRD' },
            ],
          },
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
        });
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
      });

      it('13a Processes 1-level IF', async () => {
        const template = path.join(__dirname, 'fixtures', 'if.docx');
        const result = await createReport({
          ...reportConfig,
          template,
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
        });
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
      });

      it('13b Processes 2-level IF', async () => {
        const template = path.join(__dirname, 'fixtures', 'if2.docx');
        const result = await createReport({
          ...reportConfig,
          template,
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
        });
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
      });

      it('13j Processes inline IF', async () => {
        const template = path.join(__dirname, 'fixtures', 'ifInline.docx');
        const result = await createReport({
          ...reportConfig,
          template,
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
        });
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
      });

      it('20 Processes ALIAS commands', async () => {
        const template = path.join(__dirname, 'fixtures', 'for1alias.docx');
        const result = await createReport({
          ...reportConfig,
          template,
          data: {
            companies: [
              { name: 'FIRST' },
              { name: 'SECOND' },
              { name: 'THIRD' },
            ],
          },
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
        });
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
      });

      it('22 Allows accented characters and such', async () => {
        const template = path.join(__dirname, 'fixtures', 'for1.docx');
        const result = await createReport({
          ...reportConfig,
          template,
          output: path.join(__dirname, 'fixtures', 'for1accented_report.docx'),
          data: {
            companies: [{ name: '¿Por qué?' }, { name: 'Porque sí' }],
          },
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
        });
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
      });

      it('23 Allows characters that conflict with XML', async () => {
        const template = path.join(__dirname, 'fixtures', 'for1.docx');
        const result = await createReport({
          ...reportConfig,
          template,
          output: path.join(
            __dirname,
            'fixtures',
            'for1specialChars_report.docx'
          ),
          data: {
            companies: [
              { name: '3 < 4 << 400' },
              { name: '5 > 2 >> -100' },
              { name: 'a & b && c' },
            ],
          },
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'XML',
        });
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
      });

      it('23b Allows insertion of literal XML', async () => {
        const template = path.join(__dirname, 'fixtures', 'literalXml.docx');
        const result = await createReport({
          ...reportConfig,
          template,
          data: { text: 'foo||<w:br/>||bar' },
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'XML',
        });
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
      });

      it('23c Allows insertion of literal XML with custom delimiter', async () => {
        const template = path.join(__dirname, 'fixtures', 'literalXml.docx');
        const result = await createReport({
          ...reportConfig,
          template,
          output: path.join(
            __dirname,
            'fixtures',
            'literalXmlCustomDelimiter_report.docx'
          ),
          data: { text: 'foo____<w:br/>____bar' },
          literalXmlDelimiter: '____',
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'XML',
        });
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
      });

      it('24 Allows Word to split commands arbitrarily, incl. delimiters', async () => {
        const template = path.join(
          __dirname,
          'fixtures',
          'splitDelimiters.docx'
        );
        const result = await createReport({
          ...reportConfig,
          template,
          data: { foo: 'bar' },
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
        });
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
      });

      it('25 Adds line breaks by default', async () => {
        const template = path.join(__dirname, 'fixtures', 'longText.docx');
        const result = await createReport({
          ...reportConfig,
          template,
          data: { longText: LONG_TEXT },
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'XML',
        });
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
      });

      it('25b Allows disabling line break processing', async () => {
        const template = path.join(__dirname, 'fixtures', 'longText.docx');
        const result = await createReport({
          ...reportConfig,
          template,
          output: path.join(__dirname, 'fixtures', 'longText2_report.docx'),
          data: { longText: LONG_TEXT },
          processLineBreaks: false,
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'XML',
        });
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
      });

      it('30 Processes simple JS snippets in an INS', async () => {
        const template = path.join(__dirname, 'fixtures', 'insJsSimple.docx');
        const result = await createReport({
          ...reportConfig,
          template,
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
        });
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
      });

      it('31 Processes more complex JS snippets in an INS', async () => {
        const template = path.join(__dirname, 'fixtures', 'insJsComplex.docx');
        const result = await createReport({
          ...reportConfig,
          template,
          data: { companies: ['FIRST', 'SECOND', 'THIRD'] },
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
        });
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
      });

      it('32 Provides access to loop indices (JS)', async () => {
        const template = path.join(
          __dirname,
          'fixtures',
          'insJsWithLoops.docx'
        );
        const result = await createReport({
          ...reportConfig,
          template,
          data: {
            companies: [
              { name: 'FIRST' },
              { name: 'SECOND' },
              { name: 'THIRD' },
            ],
          },
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
        });
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
      });

      it('33 Processes EXEC commands (JS)', async () => {
        const template = path.join(__dirname, 'fixtures', 'exec.docx');
        const result = await createReport({
          ...reportConfig,
          template,
          data: {},
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
        });
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
      });

      it('33b Processes EXEC with shorthand (!)', async () => {
        const template = path.join(__dirname, 'fixtures', 'execShorthand.docx');
        const result = await createReport({
          ...reportConfig,
          template,
          data: {},
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
        });
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
      });

      it('33c Processes EXEC when a promise is returned', async () => {
        const template = path.join(__dirname, 'fixtures', 'execPromise.docx');
        const result = await createReport({
          ...reportConfig,
          template,
          data: {},
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
        });
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
      });

      it('34 Processes INS with shorthand (=)', async () => {
        const template = path.join(__dirname, 'fixtures', 'insShorthand.docx');
        const result = await createReport({
          ...reportConfig,
          template,
          data: {
            companies: [
              { name: 'FIRST' },
              { name: 'SECOND' },
              { name: 'THIRD' },
            ],
          },
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
        });
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
      });

      it('35 Processes all snippets in the same sandbox', async () => {
        const template = path.join(__dirname, 'fixtures', 'execAndIns.docx');
        const result = await createReport({
          ...reportConfig,
          template,
          data: {
            companies: [
              { name: 'FIRST' },
              { name: 'SECOND' },
              { name: 'THIRD' },
            ],
          },
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
        });
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
      });

      it('36 Processes all snippets without sandbox', async () => {
        const template = path.join(__dirname, 'fixtures', 'execAndIns.docx');
        const result = await createReport({
          ...reportConfig,
          template,
          noSandbox: true,
          data: {
            companies: [
              { name: 'FIRST' },
              { name: 'SECOND' },
              { name: 'THIRD' },
            ],
          },
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
        });
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
      });

      it('36b Processes a snippet with additional context', async () => {
        const template = path.join(
          __dirname,
          'fixtures',
          'execWithContext.docx'
        );
        const result = await createReport({
          ...reportConfig,
          template,
          data: {
            companies: [
              { name: 'FIRST' },
              { name: 'SECOND' },
              { name: 'THIRD' },
            ],
          },
          additionalJsContext: {
            toLowerCase: str => str.toLowerCase(),
          },
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
        });
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
      });

      it('37a Replace a single image', async () => {
        const template = path.join(
          __dirname,
          'fixtures',
          'replaceOneImage.docx'
        );
        const image = path.join(__dirname, 'fixtures', 'cube.png');
        const result = await createReport({
          ...reportConfig,
          template,
          data: {},
          replaceImagesBase64: false,
          replaceImages: { 'image1.png': image },
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
        });
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
      });

      it('37b Replace multiple images', async () => {
        const template = path.join(
          __dirname,
          'fixtures',
          'replaceTwoImages.docx'
        );
        const image1 = path.join(__dirname, 'fixtures', 'cube.png');
        const image2 = path.join(__dirname, 'fixtures', 'cron.png');
        const result = await createReport({
          ...reportConfig,
          template,
          data: {},
          replaceImagesBase64: false,
          replaceImages: {
            'image1.png': image1,
            'image2.png': image2,
          },
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
        });
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
      });

      it('38a Processes IMAGE commands with paths', async () => {
        MockDate.set('1/1/2000');
        const template = path.join(__dirname, 'fixtures', 'imagePath.docx');
        let options = {
          template,
          data: {},
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
        };
        const result = await createReport(options);
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();

        // Also check the browser version
        const templateData = fs.readFileSync(template);
        options = timmSet(options, 'template', templateData);
        const result2 = await createReportBrowser(options);
        expect(md5(result2)).toMatchSnapshot();
      });

      it('38a-bis Processes IMAGE commands with paths in a header', async () => {
        MockDate.set('1/1/2000');
        const template = path.join(__dirname, 'fixtures', 'imageInHeader.docx');
        let options = {
          template,
          data: {},
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
        };
        const result = await createReport(options);
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();

        // Also check the browser version
        const templateData = fs.readFileSync(template);
        options = timmSet(options, 'template', templateData);
        const result2 = await createReportBrowser(options);
        expect(md5(result2)).toMatchSnapshot();
      });

      it('38b Processes IMAGE commands with base64 data', async () => {
        MockDate.set('1/1/2000');
        const template = path.join(__dirname, 'fixtures', 'imageBase64.docx');
        let options = {
          template,
          data: {},
          additionalJsContext: {
            qr: contents => {
              const dataUrl = qrcode(contents, { size: 500 });
              const data = dataUrl.slice('data:image/gif;base64,'.length);
              return { width: 6, height: 6, data, extension: '.gif' };
            },
          },
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
        };
        const result = await createReport(options);
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();

        // Also check the browser version
        const templateData = fs.readFileSync(template);
        options = timmSet(options, 'template', templateData);
        const result2 = await createReportBrowser(options);
        expect(md5(result2)).toMatchSnapshot();
      });

      it('39 Processes LINK commands', async () => {
        const template = path.join(__dirname, 'fixtures', 'links.docx');
        const result = await createReport({
          ...reportConfig,
          template,
          data: {},
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
        });
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
      });

      it('3A Processes HTML commands', async () => {
        const template = path.join(__dirname, 'fixtures', 'htmls.docx');
        const result = await createReport({
          ...reportConfig,
          template,
          data: {},
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
        });
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
      });


      it('40 Throws on invalid command', async () => {
        const template = path.join(
          __dirname,
          'fixtures',
          'invalidCommand.docx'
        );
        try {
          await createReport({
            template,
            data: {
              companies: [
                { name: 'FIRST' },
                { name: 'SECOND' },
                { name: 'THIRD' },
              ],
            },
            _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
          });
          expect(true).toBeFalsy(); // should have thrown
        } catch (err) {
          /* this exception was expected */
        }
      });

      it('41 Throws on invalid for logic', async () => {
        const template = path.join(__dirname, 'fixtures', 'invalidFor.docx');
        try {
          await createReport({
            template,
            data: {
              companies: [
                { name: 'FIRST' },
                { name: 'SECOND' },
                { name: 'THIRD' },
              ],
            },
            _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
          });
          expect(true).toBeFalsy(); // should have thrown
        } catch (err) {
          /* this exception was expected */
        }
      });

      it('41b Throws on invalid if logic (bad nesting)', async () => {
        const template = path.join(__dirname, 'fixtures', 'invalidIf.docx');
        try {
          await createReport({
            template,
            data: {
              companies: [
                { name: 'FIRST' },
                { name: 'SECOND' },
                { name: 'THIRD' },
              ],
            },
            _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
          });
          expect(true).toBeFalsy(); // should have thrown
        } catch (err) {
          /* this exception was expected */
        }
      });

      it('70 Allows customisation of cmd delimiter', async () => {
        const template = path.join(
          __dirname,
          'fixtures',
          'for1customDelimiter.docx'
        );
        const result = await createReport({
          ...reportConfig,
          template,
          data: {
            companies: [
              { name: 'FIRST' },
              { name: 'SECOND' },
              { name: 'THIRD' },
            ],
          },
          cmdDelimiter: '***',
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
        });
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
      });

      it('80 Copes with a more complex example: WBS', async () => {
        const template = path.join(__dirname, 'fixtures', 'wbs.docx');
        const result = await createReport({
          ...reportConfig,
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
          _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
        });
        if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
      });

      it("90 Browser's entry point exists", async () => {
        const browserEntry = require('../indexBrowser'); // eslint-disable-line
        expect(browserEntry).toBeDefined();
      });

      it('91 Generates a valid zipped file', async () => {
        const filepath = path.join(__dirname, 'fixtures', 'zipGeneration.docx');
        const template = fs.readFileSync(filepath);
        const result = await createReportBrowser({
          template,
          data: {
            imageType: '4x4 hideous picture',
          },
          replaceImagesBase64: true,
          replaceImages: {
            'image1.png':
              'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFUlEQVQ' +
              'I1wXBAQEAAACAkP6fFlUIaizhBvq890IMAAAAAElFTkSuQmCC',
          },
        });
        // use md5 of output, otherwise snapshot would be to big
        expect(md5(result)).toMatchSnapshot();
      });
    });
  });
});
