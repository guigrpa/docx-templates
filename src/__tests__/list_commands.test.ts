import path from 'path';
import fs from 'fs';
import { listCommands } from '../main';

describe('listCommands', () => {
  it('handles simple INS', async () => {
    const template = await fs.promises.readFile(
      path.join(__dirname, 'fixtures', 'noQuerySimpleInserts.docx')
    );
    expect(await listCommands(template)).toEqual([
      { raw: 'INS a', code: 'a', type: 'INS' },
      { raw: 'ins b', code: 'b', type: 'INS' },
    ]);
  });

  it('handles IMAGE', async () => {
    const template = await fs.promises.readFile(
      path.join(__dirname, 'fixtures', 'imagesSVG.docx')
    );
    expect(await listCommands(template, '+++')).toEqual([
      { raw: 'IMAGE svgImgFile()', code: 'svgImgFile()', type: 'IMAGE' },
      { raw: 'IMAGE svgImgStr()', code: 'svgImgStr()', type: 'IMAGE' },
    ]);
  });

  it('handles inline FOR loops', async () => {
    const template = await fs.promises.readFile(
      path.join(__dirname, 'fixtures', 'for1inline.docx')
    );
    expect(await listCommands(template)).toMatchInlineSnapshot(`
      Array [
        Object {
          "code": "company IN companies",
          "raw": "FOR company IN companies",
          "type": "FOR",
        },
        Object {
          "code": "$company.name",
          "raw": "INS $company.name",
          "type": "INS",
        },
        Object {
          "code": "company",
          "raw": "END-FOR company",
          "type": "END-FOR",
        },
      ]
    `);
  });

  it('handles IF clausess', async () => {
    const template = await fs.promises.readFile(
      path.join(__dirname, 'fixtures', 'if2.docx')
    );
    expect(await listCommands(template)).toMatchInlineSnapshot(`
      Array [
        Object {
          "code": "4 > 3",
          "raw": "IF 4 > 3",
          "type": "IF",
        },
        Object {
          "code": "true",
          "raw": "IF true",
          "type": "IF",
        },
        Object {
          "code": "",
          "raw": "END-IF",
          "type": "END-IF",
        },
        Object {
          "code": "",
          "raw": "END-IF",
          "type": "END-IF",
        },
        Object {
          "code": "4 > 3",
          "raw": "IF 4 > 3",
          "type": "IF",
        },
        Object {
          "code": "false",
          "raw": "IF false",
          "type": "IF",
        },
        Object {
          "code": "",
          "raw": "END-IF",
          "type": "END-IF",
        },
        Object {
          "code": "",
          "raw": "END-IF",
          "type": "END-IF",
        },
        Object {
          "code": "4 < 3",
          "raw": "IF 4 < 3",
          "type": "IF",
        },
        Object {
          "code": "true",
          "raw": "IF true",
          "type": "IF",
        },
        Object {
          "code": "",
          "raw": "END-IF",
          "type": "END-IF",
        },
        Object {
          "code": "",
          "raw": "END-IF",
          "type": "END-IF",
        },
      ]
    `);
  });

  it('handles custom delimiter', async () => {
    const template = await fs.promises.readFile(
      path.join(__dirname, 'fixtures', 'for1customDelimiter.docx')
    );
    expect(await listCommands(template, '***')).toMatchInlineSnapshot(`
      Array [
        Object {
          "code": "company IN companies",
          "raw": "FOR company IN companies",
          "type": "FOR",
        },
        Object {
          "code": "$company.name",
          "raw": "INS $company.name",
          "type": "INS",
        },
        Object {
          "code": "company",
          "raw": "END-FOR company",
          "type": "END-FOR",
        },
      ]
    `);
  });
});
