// @flow

/* eslint-env jest */

import path from 'path';
import fsExtra from 'fs-extra';
import Promise from 'bluebird';

// SWUT
import createReport from '..';

const fs: any = Promise.promisifyAll(fsExtra);
const outputDir = path.join(__dirname, 'out');

describe('End-to-end', () => {
  beforeEach(async () => {
    try { await fs.remove(outputDir); } catch (err) { /* bad luck */ }
  });
  afterEach(async () => {
    try { await fs.remove(outputDir); } catch (err) { /* bad luck */ }
  });

  it('01 Copies (unchanged) a template without markup', async () => {
    const template = path.join(__dirname, 'templates', 'noQuery.docx');
    const output = path.join(outputDir, 'noQuery_report.docx');
    await createReport({ template, output });
    expect(fs.existsSync(output)).toBeTruthy();
  });

  it('02 A default output path can be used', async () => {
    const template = path.join(__dirname, 'templates', 'noQuery.docx');
    const defaultOutput = path.join(__dirname, 'templates', 'noQuery_report.docx');
    await createReport({ template });
    expect(fs.existsSync(defaultOutput)).toBeTruthy();
    await fs.unlink(defaultOutput);
  });
});

describe('Template processing', () => {
  it('01 Probe should work', async () => {
    const template = path.join(__dirname, 'templates', 'noQuery.docx');
    const defaultOutput = path.join(__dirname, 'templates', 'noQuery_report.docx');
    const result = await createReport({ template, _probe: 'JS' });
    expect(fs.existsSync(defaultOutput)).toBeFalsy();
    // $FlowFixMe: Flow gets confused when unwrapping the Bluebird promise above
    expect(result._children.length).toBeTruthy();
  });

  it('02 Should correctly extract a query and call the resolver', async () => {
    const template = path.join(__dirname, 'templates', 'simpleQuery.docx');
    const queryResolver = jest.fn();
    const queryVars = { a: 'importantContext' };
    await createReport({
      template,
      data: queryResolver,
      queryVars,
      _probe: 'JS',
    });
    expect(queryResolver.mock.calls.length).toEqual(1);
    expect(queryResolver.mock.calls[0][0]).toEqual('exampleQuery');
    expect(queryResolver.mock.calls[0][1]).toEqual(queryVars);
  });

  it('03 Should use the resolver\'s response to produce the report', async () => {
    const template = path.join(__dirname, 'templates', 'simpleQuerySimpleInserts.docx');
    const result = await createReport({
      template,
      data: () => ({ a: 'foo', b: 'bar' }),
      _probe: 'JS',
    });
    expect(result).toMatchSnapshot();
  });

  it('04 Should allow replacing the resolver by a data object', async () => {
    const template = path.join(__dirname, 'templates', 'noQuerySimpleInserts.docx');
    const result = await createReport({
      template,
      data: { a: 'foo', b: 'bar' },
      _probe: 'JS',
    });
    expect(result).toMatchSnapshot();
  });

  it('05 Should process 1-level FOR loops', async () => {
    const template = path.join(__dirname, 'templates', 'for1.docx');
    const result = await createReport({
      template,
      data: { companies: [
        { name: 'FIRST' },
        { name: 'SECOND' },
        { name: 'THIRD' },
      ] },
      _probe: 'JS',
    });
    expect(result).toMatchSnapshot();
  });

  it('06 Should process 2-level FOR loops', async () => {
    const template = path.join(__dirname, 'templates', 'for2.docx');
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
      _probe: 'JS',
    });
    expect(result).toMatchSnapshot();
  });

  it('07 Should process 3-level FOR loops', async () => {
    const template = path.join(__dirname, 'templates', 'for3.docx');
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
      ] },
      _probe: 'JS',
    });
    expect(result).toMatchSnapshot();
  });

  it('08 Should process 1-level FOR-ROW loops', async () => {
    const template = path.join(__dirname, 'templates', 'for-row1.docx');
    const result = await createReport({
      template,
      data: { companies: [
        { name: 'FIRST' },
        { name: 'SECOND' },
        { name: 'THIRD' },
      ] },
      _probe: 'JS',
    });
    expect(result).toMatchSnapshot();
  });

  it('09 Should allow scalar arrays in FOR loops', async () => {
    const template = path.join(__dirname, 'templates', 'for1scalars.docx');
    const result = await createReport({
      template,
      data: { companies: ['FIRST', 'SECOND', 'THIRD'] },
      _probe: 'JS',
    });
    expect(result).toMatchSnapshot();
  });

  it('10 Should allow access to the index in FOR loops', async () => {
    const template = path.join(__dirname, 'templates', 'for1index.docx');
    const result = await createReport({
      template,
      data: { companies: [
        { name: 'FIRST' },
        { name: 'SECOND' },
        { name: 'THIRD' },
      ] },
      _probe: 'JS',
    });
    expect(result).toMatchSnapshot();
  });

  it('20 Should process SHORTHAND commands', async () => {
    const template = path.join(__dirname, 'templates', 'for1shorthand.docx');
    const result = await createReport({
      template,
      data: { companies: [
        { name: 'FIRST' },
        { name: 'SECOND' },
        { name: 'THIRD' },
      ] },
      _probe: 'JS',
    });
    expect(result).toMatchSnapshot();
  });

  it('21 Should process VAR commands', async () => {
    const template = path.join(__dirname, 'templates', 'for1var.docx');
    const result = await createReport({
      template,
      data: { companies: [
        { name: 'FIRST' },
        { name: 'SECOND' },
        { name: 'THIRD' },
      ] },
      _probe: 'JS',
    });
    expect(result).toMatchSnapshot();
  });

  it('22 Should allow accented characters and such', async () => {
    const template = path.join(__dirname, 'templates', 'for1.docx');
    const result = await createReport({
      template,
      data: { companies: [
        { name: '¿Por qué?' },
        { name: 'Porque sí' },
      ] },
      _probe: 'JS',
    });
    expect(result).toMatchSnapshot();
  });

  it('23 Should allow characters that conflict with XML', async () => {
    const template = path.join(__dirname, 'templates', 'for1.docx');
    const xml = await createReport({
      template,
      data: { companies: [
        { name: '3 < 4 << 400' },
        { name: '5 > 2 >> -100' },
        { name: 'a & b && c' },
      ] },
      _probe: 'XML',
    });
    expect(xml).toMatchSnapshot();
  });

  it('70 Should allow customisation of cmd delimiter', async () => {
    const template = path.join(__dirname, 'templates', 'for1customDelimiter.docx');
    const result = await createReport({
      template,
      data: { companies: [
        { name: 'FIRST' },
        { name: 'SECOND' },
        { name: 'THIRD' },
      ] },
      cmdDelimiter: '***',
      _probe: 'JS',
    });
    expect(result).toMatchSnapshot();
  });

  it('80 Should produce a more complex example: WBS', async () => {
    const template = path.join(__dirname, 'templates', 'wbs.docx');
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
      _probe: 'JS',
    });
    expect(result).toMatchSnapshot();
  });
});
