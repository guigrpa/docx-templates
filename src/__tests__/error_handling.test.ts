import path from 'path';
import fs from 'fs';
import QR from 'qrcode';
import { createReport } from '../index';
import { setDebugLogSink } from '../debug';
import {
  isError,
  NullishCommandResultError,
  CommandExecutionError,
  InvalidCommandError,
} from '../errors';

if (process.env.DEBUG) setDebugLogSink(console.log);

class NoErrorThrownError extends Error {}

const getError = async <TError>(call: () => unknown): Promise<TError> => {
  try {
    await call();
    throw new NoErrorThrownError();
  } catch (error: unknown) {
    return error as TError;
  }
};

['noSandbox', 'sandbox'].forEach(sbStatus => {
  const noSandbox = sbStatus === 'sandbox' ? false : true;

  describe(`${sbStatus}`, () => {
    describe('rejectNullish setting', () => {
      it('INS', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'rejectNullishINS.docx')
        );

        // When not explicitly set, rejectNullish should be considered 'false' so this case should resolve.
        await expect(
          createReport({
            noSandbox,
            template,
            data: {
              testobj: {}, // accessing a non-existing property will result in `undefined`
              test2: 'second value!',
            },
          })
        ).resolves.toBeInstanceOf(Uint8Array);

        // The same case should throw when we decide NOT to accept nullish values.
        await expect(
          createReport({
            noSandbox,
            template,
            data: {
              testobj: {}, // accessing a non-existing property will result in `undefined`
              test2: 'second value!',
            },
            rejectNullish: true,
          })
        ).rejects.toBeInstanceOf(Error);

        // Should be ok when we actually set the value.
        await expect(
          createReport({
            noSandbox,
            template,
            data: {
              testobj: { value: 'the value is now set' },
              test2: 'second value!',
            },
            rejectNullish: true,
          })
        ).resolves.toBeInstanceOf(Uint8Array);
      });

      it('IMAGE', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'rejectNullishIMAGE.docx')
        );
        await expect(
          createReport({
            noSandbox,
            template,
            data: {},
            additionalJsContext: {
              qr: () => undefined,
            },
          })
        ).resolves.toBeInstanceOf(Uint8Array);

        await expect(
          createReport({
            noSandbox,
            template,
            data: {},
            rejectNullish: true,
            additionalJsContext: {
              qr: () => undefined,
            },
          })
        ).rejects.toThrowErrorMatchingSnapshot();

        await expect(
          createReport({
            noSandbox,
            template,
            data: {},
            rejectNullish: true,
            additionalJsContext: {
              qr: async (contents: string) => {
                const dataUrl = await QR.toDataURL(contents, { width: 500 });
                const data = dataUrl.slice('data:image/gif;base64,'.length);
                return { width: 6, height: 6, data, extension: '.gif' };
              },
            },
          })
        ).resolves.toBeInstanceOf(Uint8Array);
      });
    });

    describe('custom ErrorHandler', () => {
      it('allows graceful handling of NullishCommandResultError', async () => {
        expect.assertions(3);

        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'rejectNullishINS.docx')
        );

        const result = await createReport(
          {
            noSandbox,
            template,
            data: {
              testobj: {}, // accessing a non-existing property will result in `undefined`
              test2: 'second value!',
            },
            rejectNullish: true,
            errorHandler: (err, code) => {
              expect(err).toBeInstanceOf(NullishCommandResultError);
              expect(code).toStrictEqual('testobj.value');
              return `${err}`;
            },
          },
          'XML'
        );
        expect(result).toMatchSnapshot();
      });

      it('handles arbitrary errors occurring in command execution', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'commandExecutionError.docx')
        );

        // First check whether the CommandExecutionError is triggered correctly
        await expect(
          createReport({ noSandbox, template, data: {} })
        ).rejects.toThrow(CommandExecutionError);

        // Now try with an errorHandler
        expect(
          await createReport(
            {
              noSandbox,
              template,
              data: {},
              errorHandler: (err, code) => 'no problem dude',
            },
            'XML'
          )
        ).toMatchSnapshot();
      });

      it('properly handles InvalidCommandError', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'invalidCommand.docx')
        );

        const errs: Error[] = [];
        expect(
          await createReport(
            {
              noSandbox,
              template,
              data: {},
              errorHandler: (err, code) => {
                errs.push(err);
                return `${err}`;
              },
            },
            'XML'
          )
        ).toMatchSnapshot();

        expect(errs).toMatchSnapshot();
      });

      it('handler can decide to re-throw the error, crashing the render', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'invalidCommand.docx')
        );

        await expect(
          createReport({
            noSandbox,
            template,
            data: {},
            errorHandler: (err, code) => {
              throw new Error('yeah, no!');
            },
          })
        ).rejects.toThrow('yeah, no!');
      });

      it('properly handles nested InvalidCommandError from invalid FOR', async () => {
        const template = await fs.promises.readFile(
          path.join(__dirname, 'fixtures', 'invalidForCmd.docx')
        );

        const errs: Error[] = [];
        const cmds: (string | undefined)[] = [];
        expect(
          await createReport(
            {
              noSandbox,
              template,
              data: {},
              errorHandler: (err, code) => {
                errs.push(err);
                cmds.push(code);
                return `${err} (${code})`;
              },
            },
            'XML'
          )
        ).toMatchSnapshot();

        expect(errs).toMatchSnapshot();
        expect(cmds).toMatchSnapshot();
      });
    });
  });

  it('throw when user tries to iterate over non-array', async () => {
    const template = await fs.promises.readFile(
      path.join(__dirname, 'fixtures', 'forOverObject.docx')
    );
    await expect(
      createReport({
        noSandbox,
        template,
        data: {
          companies: {
            one: 'FIRST',
            two: 'SECOND',
            three: 'THIRD',
          },
        },
      })
    ).rejects.toThrowErrorMatchingSnapshot();
  });

  it('throw when result of INS command is an object', async () => {
    const template = await fs.promises.readFile(
      path.join(__dirname, 'fixtures', 'objectCommandResultError.docx')
    );
    await expect(
      createReport({
        noSandbox,
        template,
        data: {
          companies: {
            one: 'FIRST',
            two: 'SECOND',
            three: 'THIRD',
          },
        },
      })
    ).rejects.toThrowErrorMatchingSnapshot();
  });

  it('attaches the result to ObjectCommandResultError', async () => {
    const template = await fs.promises.readFile(
      path.join(__dirname, 'fixtures', 'objectCommandResultError.docx')
    );

    await expect(
      createReport({
        noSandbox,
        template,
        data: {
          companies: {
            one: 'FIRST',
            two: 'SECOND',
            three: 'THIRD',
          },
        },
      })
    ).rejects.toHaveProperty('result', {
      one: 'FIRST',
      two: 'SECOND',
      three: 'THIRD',
    });
  });

  it('Incomplete conditional statement: missing END-IF', async () => {
    const template = await fs.promises.readFile(
      path.join(__dirname, 'fixtures', 'missingEndIf.docx')
    );
    await expect(
      createReport({
        noSandbox,
        template,
        data: {},
        rejectNullish: true,

        // We use failFast:false to ensure the error handling of a missing END-IF and missing END-FOR are not accidentally mixed, see Github issue #322.
        failFast: false,
      })
    ).rejects.toMatchSnapshot();
  });

  it('Incomplete conditional statement: missing IF statement', async () => {
    const template = await fs.promises.readFile(
      path.join(__dirname, 'fixtures', 'unmatchedEndIf.docx')
    );
    await expect(
      createReport({
        noSandbox,
        template,
        data: {},
        rejectNullish: false, // needs to be false for the expected error to trigger instead of the NullishCommandResultError.
      })
    ).rejects.toThrow(
      `Unexpected END-IF outside of IF statement context: END-IF`
    );
  });

  it('Incomplete loop statement: unmatched END-FOR', async () => {
    const template = await fs.promises.readFile(
      path.join(__dirname, 'fixtures', 'unmatchedEndFor.docx')
    );
    await expect(
      createReport({
        noSandbox,
        template,
        data: {},
      })
    ).rejects.toThrow(
      `Unexpected END-FOR outside of FOR loop context: END-FOR`
    );
  });

  it('Incomplete loop statement: missing END-FOR', async () => {
    const template = await fs.promises.readFile(
      path.join(__dirname, 'fixtures', 'missingEndFor.docx')
    );
    await expect(
      createReport({
        noSandbox,
        template,
        data: {},
      })
    ).rejects.toThrow(
      `Unterminated FOR-loop ('FOR c'). Make sure each FOR loop has a corresponding END-FOR command.`
    );
  });

  it('Incomplete loop statement: invalid FOR', async () => {
    const template = await fs.promises.readFile(
      path.join(__dirname, 'fixtures', 'invalidForCmd.docx')
    );
    await expect(
      createReport({
        noSandbox,
        template,
        data: {},
      })
    ).rejects.toThrow('Invalid FOR command: FOR person');
  });
});

describe('errors from different realms', () => {
  it('sandbox', async () => {
    const template = await fs.promises.readFile(
      path.join(__dirname, 'fixtures', 'referenceError.docx')
    );

    const error = await getError(() =>
      createReport({ noSandbox: false, template, data: {} })
    );
    expect(error).toBeInstanceOf(CommandExecutionError);

    // We cannot check with instanceof as this Error is from another realm despite still being an error
    const commandExecutionError = error as CommandExecutionError;
    expect(commandExecutionError.err).not.toBeInstanceOf(ReferenceError);
    expect(commandExecutionError.err).not.toBeInstanceOf(Error);
    expect(commandExecutionError.err.name).toBe('ReferenceError');
    expect(commandExecutionError.err.message).toBe(
      'nonExistentVariable is not defined'
    );
  });

  it('noSandbox', async () => {
    const template = await fs.promises.readFile(
      path.join(__dirname, 'fixtures', 'referenceError.docx')
    );

    const error = await getError(() =>
      createReport({ noSandbox: true, template, data: {} })
    );
    expect(error).toBeInstanceOf(CommandExecutionError);

    // Without sandboxing, the error is from the same realm
    const commandExecutionError = error as CommandExecutionError;
    expect(commandExecutionError.err).toBeInstanceOf(ReferenceError);
    expect(commandExecutionError.err).toBeInstanceOf(Error);
    expect(commandExecutionError.err.name).toBe('ReferenceError');
    expect(commandExecutionError.err.message).toBe(
      'nonExistentVariable is not defined'
    );
  });
});

describe('isError', () => {
  it('Error is an error', () => {
    expect(isError(new Error())).toBeTruthy();
  });

  it('error-like object is an error', () => {
    expect(
      isError({
        name: 'ReferenceError',
        message: 'nonExistentVariable is not defined',
      })
    ).toBeTruthy();
  });

  it('primitive is not an error', () => {
    expect(isError(1)).toBeFalsy();
  });
});
