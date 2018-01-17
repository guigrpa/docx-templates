// @flow

/* eslint-disable no-param-reassign */

import vm from 'vm';
import { merge, omit } from 'timm';
import { getCurLoop } from './reportUtils';
import type { ReportData, Context } from './types';

const DEBUG = process.env.DEBUG_DOCX_TEMPLATES;
const log: any = DEBUG ? require('./debug').mainStory : null;

const runUserJsAndGetString = (
  data: ?ReportData,
  code: string,
  ctx: Context
): string => {
  const result = runUserJsAndGetRaw(data, code, ctx);
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

const runUserJsAndGetRaw = (
  data: ?ReportData,
  code: string,
  ctx: Context
): any => {
  const sandbox = merge(
    ctx.jsSandbox || {},
    {
      __code__: code,
      __result__: undefined,
    },
    data
  );
  const curLoop = getCurLoop(ctx);
  if (curLoop) sandbox.$idx = curLoop.idx;
  Object.keys(ctx.vars).forEach(varName => {
    sandbox[`$${varName}`] = ctx.vars[varName];
  });
  let context = null;
  let result = null;
  if (ctx.options.noSandbox) {
    context = sandbox;
    const wrapper = new Function('with(this) { return eval(__code__); }'); // eslint-disable-line no-new-func
    result = wrapper.call(context);
  } else {
    const script = new vm.Script(
      `
      __result__ = eval(__code__);
      `,
      {}
    );
    context = new vm.createContext(sandbox); // eslint-disable-line new-cap
    script.runInContext(context);
    result = context.__result__;
  }
  ctx.jsSandbox = omit(context, ['__code__', '__result__']);
  DEBUG && log.debug('JS result', { attach: result });
  return result;
};

// ==========================================
// Public API
// ==========================================
export { runUserJsAndGetString, runUserJsAndGetRaw };
