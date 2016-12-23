// @flow

import vm from 'vm';
import { merge } from 'timm';
import { getCurLoop } from './reportUtils';
import type {
  ReportData, Context,
} from './types';

const DEBUG = process.env.DEBUG_DOCX_TEMPLATES;
const log: any = DEBUG ? require('./debug').mainStory : null;

const runUserJsAndGetString = (data: ?ReportData, code: string, ctx: Context): string => {
  const result = runUserJsAndGetRaw(data, code, ctx);
  if (result == null) return '';
  let str = String(result);
  if (ctx.options.processLineBreaks) {
    const { literalXmlDelimiter } = ctx.options;
    str = str.replace(/\n/g, `${literalXmlDelimiter}<w:br/>${literalXmlDelimiter}`);
  }
  return str;
};

const runUserJsAndGetRaw = (data: ?ReportData, code: string, ctx: Context): any => {
  const sandbox = merge({
    __code__: code,
    __result__: undefined,
  }, data);
  const curLoop = getCurLoop(ctx);
  if (curLoop) sandbox.$idx = curLoop.idx;
  Object.keys(ctx.vars).forEach((varName) => {
    sandbox[`$${varName}`] = ctx.vars[varName];
  });
  const script = new vm.Script(`
    __result__ = eval(__code__);
  `, {});
  const context = new vm.createContext(sandbox);  // eslint-disable-line new-cap
  script.runInContext(context);
  const result = sandbox.__result__;
  DEBUG && log.debug('JS result', { attach: result });
  return result;
};

// ==========================================
// Public API
// ==========================================
export {
  runUserJsAndGetString,
  runUserJsAndGetRaw,
};
