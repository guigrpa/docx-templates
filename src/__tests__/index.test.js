// @flow

/* eslint-env jest */

import path from 'path';
import fsExtra from 'fs-extra';
import Promise from 'bluebird';

// SWUT
import createReport from '..';

const fs: any = Promise.promisifyAll(fsExtra);
const outputDir = path.join(__dirname, 'out');
const WRITE_REPORTS_TO_FILE = false;

describe('End-to-end', () => {
  beforeEach(async () => {
    try { await fs.remove(outputDir); } catch (err) { /* bad luck */ }
  });
  // afterEach(async () => {
  //   try { await fs.remove(outputDir); } catch (err) { /* bad luck */ }
  // });

  it('01 Copies (unchanged) a template without markup', async () => {
    const template = path.join(__dirname, 'fixtures', 'noQuery.docx');
    const output = path.join(outputDir, 'noQuery_report.docx');
    await createReport({ template, output });
    expect(fs.existsSync(output)).toBeTruthy();
  });

  it('02 A default output path can be used', async () => {
    const template = path.join(__dirname, 'fixtures', 'noQuery.docx');
    const defaultOutput = path.join(__dirname, 'fixtures', 'noQuery_report.docx');
    await createReport({ template });
    expect(fs.existsSync(defaultOutput)).toBeTruthy();
    await fs.unlink(defaultOutput);
  });
});

describe('Template processing', () => {
  it('01 Probe should work', async () => {
    const template = path.join(__dirname, 'fixtures', 'noQuery.docx');
    const defaultOutput = path.join(__dirname, 'fixtures', 'noQuery_report.docx');
    const result = await createReport({ template, _probe: 'JS' });
    expect(fs.existsSync(defaultOutput)).toBeFalsy();
    expect(result._children.length).toBeTruthy();
  });

  it('02 Should correctly extract a query and call the resolver', async () => {
    const template = path.join(__dirname, 'fixtures', 'simpleQuery.docx');
    const queryResolver = jest.fn();
    const queryVars = { a: 'importantContext' };
    await createReport({
      template,
      data: queryResolver,
      queryVars,
      _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
    });
    expect(queryResolver.mock.calls.length).toEqual(1);
    expect(queryResolver.mock.calls[0][0]).toEqual('exampleQuery');
    expect(queryResolver.mock.calls[0][1]).toEqual(queryVars);
  });

  it('03 Should use the resolver\'s response to produce the report', async () => {
    const template = path.join(__dirname, 'fixtures', 'simpleQuerySimpleInserts.docx');
    const result = await createReport({
      template,
      data: () => ({ a: 'foo', b: 'bar' }),
      _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
    });
    if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
  });

  it('04 Should allow replacing the resolver by a data object', async () => {
    const template = path.join(__dirname, 'fixtures', 'noQuerySimpleInserts.docx');
    const result = await createReport({
      template,
      data: { a: 'foo', b: 'bar' },
      _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
    });
    if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
  });

  it('05 Should process 1-level FOR loops', async () => {
    const template = path.join(__dirname, 'fixtures', 'for1.docx');
    const result = await createReport({
      template,
      data: { companies: [
        { name: 'FIRST' },
        { name: 'SECOND' },
        { name: 'THIRD' },
      ] },
      _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
    });
    if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
  });

  it('06 Should process 2-level FOR loops', async () => {
    const template = path.join(__dirname, 'fixtures', 'for2.docx');
    const result = await createReport({
      template,
      data: { companies: [
        {
          name: 'FIRST',
          people: [
            { firstName: 'Pep' },
            { firstName: 'Fidel' },
          ],
        },
        {
          name: 'SECOND',
          people: [
            { firstName: 'Albert' },
            { firstName: 'Xavi' },
          ],
        },
      ] },
      _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
    });
    if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
  });

  it('07 Should process 3-level FOR loops', async () => {
    const template = path.join(__dirname, 'fixtures', 'for3.docx');
    const result = await createReport({
      template,
      data: { companies: [
        {
          name: 'FIRST',
          people: [
            { firstName: 'Pep', projects: [{ name: 'one' }, { name: 'two' }] },
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
      ] },
      _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
    });
    if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
  });

  it('08 Should process 1-level FOR-ROW loops', async () => {
    const template = path.join(__dirname, 'fixtures', 'for-row1.docx');
    const result = await createReport({
      template,
      data: { companies: [
        { name: 'FIRST' },
        { name: 'SECOND' },
        { name: 'THIRD' },
      ] },
      _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
    });
    if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
  });

  it('09 Should allow scalar arrays in FOR loops', async () => {
    const template = path.join(__dirname, 'fixtures', 'for1scalars.docx');
    const result = await createReport({
      template,
      data: { companies: ['FIRST', 'SECOND', 'THIRD'] },
      _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
    });
    if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
  });

  it('10 Should process JS snippets to get the array elements', async () => {
    const template = path.join(__dirname, 'fixtures', 'for1js.docx');
    const result = await createReport({
      template,
      data: { companies: [
        { name: 'abengoa' },
        { name: 'Endesa' },
        { name: 'IBERDROLA' },
        { name: 'Acerinox' },
      ] },
      // _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
    });
    // if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
  });

  it('11 Should process inline FOR loops', async () => {
    const template = path.join(__dirname, 'fixtures', 'for1inline.docx');
    const result = await createReport({
      template,
      data: { companies: [
        { name: 'FIRST' },
        { name: 'SECOND' },
        { name: 'THIRD' },
      ] },
      _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
    });
    if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
  });

  it('12 Should process a more complex inline FOR loop with spaces', async () => {
    const template = path.join(__dirname, 'fixtures', 'for1inlineWithSpaces.docx');
    const result = await createReport({
      template,
      data: { companies: [
        { name: 'FIRST' },
        { name: 'SECOND' },
        { name: 'THIRD' },
      ] },
      _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
    });
    if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
  });

  it('20 Should process SHORTHAND commands', async () => {
    const template = path.join(__dirname, 'fixtures', 'for1shorthand.docx');
    const result = await createReport({
      template,
      data: { companies: [
        { name: 'FIRST' },
        { name: 'SECOND' },
        { name: 'THIRD' },
      ] },
      _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
    });
    if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
  });

  it('21 Should process VAR commands', async () => {
    const template = path.join(__dirname, 'fixtures', 'for1var.docx');
    const result = await createReport({
      template,
      data: { companies: [
        { name: 'FIRST' },
        { name: 'SECOND' },
        { name: 'THIRD' },
      ] },
      _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
    });
    if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
  });

  it('21b Should process VAR commands with JS', async () => {
    const template = path.join(__dirname, 'fixtures', 'for1varJs.docx');
    const result = await createReport({
      template,
      data: { companies: [
        { name: 'FIRST' },
        { name: 'SECOND' },
        { name: 'THIRD' },
      ] },
      _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
    });
    if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
  });

  it('22 Should allow accented characters and such', async () => {
    const template = path.join(__dirname, 'fixtures', 'for1.docx');
    const result = await createReport({
      template,
      output: path.join(__dirname, 'fixtures', 'for1accented_report.docx'),
      data: { companies: [
        { name: '¿Por qué?' },
        { name: 'Porque sí' },
      ] },
      _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
    });
    if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
  });

  it('23 Should allow characters that conflict with XML', async () => {
    const template = path.join(__dirname, 'fixtures', 'for1.docx');
    const result = await createReport({
      template,
      output: path.join(__dirname, 'fixtures', 'for1specialChars_report.docx'),
      data: { companies: [
        { name: '3 < 4 << 400' },
        { name: '5 > 2 >> -100' },
        { name: 'a & b && c' },
      ] },
      _probe: WRITE_REPORTS_TO_FILE ? undefined : 'XML',
    });
    if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
  });

  it('24 Should allow Word to split commands arbitrarily, incl. delimiters', async () => {
    const template = path.join(__dirname, 'fixtures', 'splitDelimiters.docx');
    const result = await createReport({
      template,
      data: { foo: 'bar' },
      _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
    });
    if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
  });

  it('30 Should process simple JS snippets in an INS', async () => {
    const template = path.join(__dirname, 'fixtures', 'insJsSimple.docx');
    const result = await createReport({
      template,
      _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
    });
    if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
  });

  it('31 Should process more complex JS snippets in an INS', async () => {
    const template = path.join(__dirname, 'fixtures', 'insJsComplex.docx');
    const result = await createReport({
      template,
      data: { companies: ['FIRST', 'SECOND', 'THIRD'] },
      _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
    });
    if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
  });

  it('32 Should provide access to vars and loop indices (JS)', async () => {
    const template = path.join(__dirname, 'fixtures', 'insJsWithLoops.docx');
    const result = await createReport({
      template,
      data: { companies: [
        { name: 'FIRST' },
        { name: 'SECOND' },
        { name: 'THIRD' },
      ] },
      _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
    });
    if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
  });

  it('40 Should throw on invalid command', async () => {
    const template = path.join(__dirname, 'fixtures', 'invalidCommand.docx');
    try {
      await createReport({
        template,
        data: { companies: [
          { name: 'FIRST' },
          { name: 'SECOND' },
          { name: 'THIRD' },
        ] },
        _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
      });
      expect(true).toBeFalsy(); // should have thrown
    } catch (err) { /* this exception was expected */ }
  });

  it('41 Should throw on invalid for logic', async () => {
    const template = path.join(__dirname, 'fixtures', 'invalidFor.docx');
    try {
      await createReport({
        template,
        data: { companies: [
          { name: 'FIRST' },
          { name: 'SECOND' },
          { name: 'THIRD' },
        ] },
        _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
      });
      expect(true).toBeFalsy(); // should have thrown
    } catch (err) { /* this exception was expected */ }
  });

  it('70 Should allow customisation of cmd delimiter', async () => {
    const template = path.join(__dirname, 'fixtures', 'for1customDelimiter.docx');
    const result = await createReport({
      template,
      data: { companies: [
        { name: 'FIRST' },
        { name: 'SECOND' },
        { name: 'THIRD' },
      ] },
      cmdDelimiter: '***',
      _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
    });
    if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
  });

  it('80 Should produce a more complex example: WBS', async () => {
    const template = path.join(__dirname, 'fixtures', 'wbs.docx');
    const result = await createReport({
      template,
      data: { project: {
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
      } },
      _probe: WRITE_REPORTS_TO_FILE ? undefined : 'JS',
    });
    if (!WRITE_REPORTS_TO_FILE) expect(result).toMatchSnapshot();
  });
});
