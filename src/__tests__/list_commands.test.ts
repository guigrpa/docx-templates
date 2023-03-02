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

  it('handles INS in header and footer', async () => {
    const template = await fs.promises.readFile(
      path.join(__dirname, 'fixtures', 'insertInHeaderAndFooter.docx')
    );
    expect(await listCommands(template)).toMatchInlineSnapshot(`
      [
        {
          "code": "body_command",
          "raw": "INS body_command",
          "type": "INS",
        },
        {
          "code": "footer_command",
          "raw": "INS footer_command",
          "type": "INS",
        },
        {
          "code": "header_command",
          "raw": "INS header_command",
          "type": "INS",
        },
      ]
    `);
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

  it('handles IMAGE in header', async () => {
    const template = await fs.promises.readFile(
      path.join(__dirname, 'fixtures', 'imageHeader.docx')
    );
    expect(await listCommands(template, '+++')).toMatchInlineSnapshot(`
      [
        {
          "code": "image()",
          "raw": "IMAGE image()",
          "type": "IMAGE",
        },
        {
          "code": "image()",
          "raw": "IMAGE image()",
          "type": "IMAGE",
        },
      ]
    `);
  });

  it('handles inline FOR loops', async () => {
    const template = await fs.promises.readFile(
      path.join(__dirname, 'fixtures', 'for1inline.docx')
    );
    expect(await listCommands(template)).toMatchInlineSnapshot(`
      [
        {
          "code": "company IN companies",
          "raw": "FOR company IN companies",
          "type": "FOR",
        },
        {
          "code": "$company.name",
          "raw": "INS $company.name",
          "type": "INS",
        },
        {
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
      [
        {
          "code": "4 > 3",
          "raw": "IF 4 > 3",
          "type": "IF",
        },
        {
          "code": "true",
          "raw": "IF true",
          "type": "IF",
        },
        {
          "code": "",
          "raw": "END-IF",
          "type": "END-IF",
        },
        {
          "code": "",
          "raw": "END-IF",
          "type": "END-IF",
        },
        {
          "code": "4 > 3",
          "raw": "IF 4 > 3",
          "type": "IF",
        },
        {
          "code": "false",
          "raw": "IF false",
          "type": "IF",
        },
        {
          "code": "",
          "raw": "END-IF",
          "type": "END-IF",
        },
        {
          "code": "",
          "raw": "END-IF",
          "type": "END-IF",
        },
        {
          "code": "4 < 3",
          "raw": "IF 4 < 3",
          "type": "IF",
        },
        {
          "code": "true",
          "raw": "IF true",
          "type": "IF",
        },
        {
          "code": "",
          "raw": "END-IF",
          "type": "END-IF",
        },
        {
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
      [
        {
          "code": "company IN companies",
          "raw": "FOR company IN companies",
          "type": "FOR",
        },
        {
          "code": "$company.name",
          "raw": "INS $company.name",
          "type": "INS",
        },
        {
          "code": "company",
          "raw": "END-FOR company",
          "type": "END-FOR",
        },
      ]
    `);
  });
});
