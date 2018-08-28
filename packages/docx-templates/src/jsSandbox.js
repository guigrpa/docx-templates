// @flow

/* eslint-disable no-param-reassign */

import vm from 'vm';
import { VM, VMScript } from 'vm2';
import { merge, omit } from 'timm';
import { getCurLoop } from './reportUtils';
import type { ReportData, Context } from './types';

const DEBUG = process.env.DEBUG_DOCX_TEMPLATES;
const log: any = DEBUG ? require('./debug').mainStory : null;

// Runs a user snippet in a sandbox, and returns the result
// as a string. If the `processLineBreaks` flag is set,
// newlines are replaced with a `w:br` tag (protected by
// the `literalXmlDelimiter` separators)
// See more details in runUserJsAndGetRaw() below.
const runUserJsAndGetString = async (
  data: ?ReportData,
  code: string,
  ctx: Context
): Promise<string> => {
  const result = await runUserJsAndGetRaw(data, code, ctx);
  if (result == null) return '';
  let str = String(result);
  if (ctx.options.processLineBreaks) {
    const { literalXmlDelimiter } = ctx.options;
    str = str.replace(
      /\n/g,
      `${literalXmlDelimiter}<w:br/>${literalXmlDelimiter}`
    );
  }
  return str;
};

// Runs a user snippet in a sandbox, and returns the result.
// The snippet can return a Promise, which is then awaited.
// The sandbox is kept for the execution of snippets later on
// in the template. Sandboxing can also be disabled via
// ctx.options.noSandbox.
const runUserJsAndGetRaw = async (
  data: ?ReportData,
  code: string,
  ctx: Context
): Promise<any> => {
  // Retrieve the current JS sandbox contents (if any) and add
  // the code to be run, and a placeholder for the result,
  // as well as all data defined by the user
  const sandbox = merge(
    ctx.jsSandbox || {},
    {
      __code__: code,
      __result__: undefined
    },
    data,
    ctx.options.additionalJsContext
  );

  // Add currently defined vars, including loop vars and the index
  // of the innermost loop
  const curLoop = getCurLoop(ctx);
  if (curLoop) sandbox.$idx = curLoop.idx;
  Object.keys(ctx.vars).forEach(varName => {
    sandbox[`$${varName}`] = ctx.vars[varName];
  });

  // Run the JS snippet and extract the result
  let context;
  let result;
  if (ctx.options.noSandbox) {
    context = sandbox;
    const wrapper = new Function('with(this) { return eval(__code__); }'); // eslint-disable-line no-new-func
    result = wrapper.call(context);
  } else if (ctx.options.vm2Sandbox) {
    const script = new VMScript(
      `
      __result__ = eval(__code__);
      `
    ).compile();
    const vm2 = new VM({
      ...(typeof ctx.options.vm2Sandbox === 'object'
        ? ctx.options.vm2Sandbox
        : {}),
      sandbox
    });
    vm2.run(script);
    context = omit(vm2._context, ['VMError', 'Buffer']);
    result = context.__result__;
  } else {
    const script = new vm.Script(
      `
      __result__ = eval(__code__);
      `,
      {}
    );
    context = new vm.createContext(sandbox); // eslint-disable-line new-cap
    script.runInContext(context);
    // $FlowFixMe: this attribute is set in the inside code, not known by Flow
    result = context.__result__;
  }

  // Wait for pormises to resolve
  if (typeof result === 'object' && result.then) result = await result;

  // Save the sandbox for later use
  ctx.jsSandbox = omit(context, ['__code__', '__result__']);
  DEBUG && log.debug('JS result', { attach: result });
  return result;
};

// ==========================================
// Public API
// ==========================================
export { runUserJsAndGetString, runUserJsAndGetRaw };
