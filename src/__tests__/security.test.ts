/* eslint-env jest */

import path from 'path';
import fs from 'fs';
import vm from 'vm';
import JSZip from 'jszip';
import { createReport } from '../index';
import { SandBox } from '../types';

const ATTACK_CODE =
  'throw new Error("attacker-controlled __code__ was executed")';

const readExecTemplate = () =>
  fs.promises.readFile(path.join(__dirname, 'fixtures', 'exec.docx'));

const getDocumentXml = async (report: Uint8Array) => {
  const zip = await JSZip.loadAsync(report);
  return zip.file('word/document.xml')!.async('text');
};

describe('sandbox internal keys cannot be overridden by report data', () => {
  ['sandbox', 'noSandbox'].forEach(sbStatus => {
    const noSandbox = sbStatus === 'noSandbox';

    it(`${sbStatus}: ignores __code__ and __result__ from data`, async () => {
      const template = await readExecTemplate();
      const result = await createReport({
        noSandbox,
        template,
        data: {
          __code__: ATTACK_CODE,
          __result__: 'attacker-controlled result',
        },
      });

      // The template's own commands must still run, and the attacker's code
      // must not have been executed (which would have thrown above).
      const documentXml = await getDocumentXml(result);
      expect(documentXml).toContain('4');
      expect(documentXml).toContain('enigrebua');
    });
  });

  it('passes the template code, not data.__code__, to a custom sandbox', async () => {
    const template = await readExecTemplate();
    const seenCodes: string[] = [];
    const runJs = ({ sandbox }: { sandbox: SandBox }) => {
      const code = sandbox.__code__ ?? '';
      seenCodes.push(code);
      const script = new vm.Script(code);
      const context = vm.createContext(sandbox);
      return {
        modifiedSandbox: context as unknown as SandBox,
        result: script.runInContext(context),
      };
    };

    const result = await createReport({
      template,
      data: {
        __code__: ATTACK_CODE,
        __result__: 'attacker-controlled result',
      },
      runJs,
    });

    expect(seenCodes).not.toContain(ATTACK_CODE);
    expect(seenCodes.some(code => code.includes('reverse'))).toBe(true);
    const documentXml = await getDocumentXml(result);
    expect(documentXml).toContain('enigrebua');
  });
});
