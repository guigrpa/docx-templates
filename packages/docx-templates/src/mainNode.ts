import path from 'path';
import fs from 'fs-extra';
import createReportBrowser from './mainBrowser';
import type { UserOptions, UserOptionsInternal, Node } from './types';
import log from './debug'

// TODO: remove / refactor
const DEBUG = process.env.DEBUG_DOCX_TEMPLATES;

const BUFFER_VALUE = 'buffer';
// ==========================================
// Main
// ==========================================
const getDefaultOutput = (templatePath: string): string => {
  const { dir, name, ext } = path.parse(templatePath);
  return path.join(dir, `${name}_report${ext}`);
};

async function createReport(options: UserOptions): Promise<Uint8Array>;
async function createReport(options: UserOptions, _probe: 'JS'): Promise<Node>;
async function createReport(options: UserOptions, _probe: 'XML'): Promise<string>;
async function createReport(options: UserOptions, _probe?: 'JS' | 'XML'): Promise<Node | string | Uint8Array> {
  const { template } = options;
  const templateIsBuffer = template instanceof Buffer;
  const output =
    options.output ||
    (templateIsBuffer ? BUFFER_VALUE : getDefaultOutput(template.toString()));
  DEBUG && log.debug(`Output file: ${output}`);

  // ---------------------------------------------------------
  // Load template from filesystem
  // ---------------------------------------------------------
  DEBUG &&
    log.debug(
      templateIsBuffer
        ? `Reading template from buffer...`
        : `Reading template from disk at ${template.toString()}...`
    );
  const buffer = template instanceof Buffer ? template : await fs.readFile(template);
  const newOptions: UserOptionsInternal = { ...options, template: buffer };

  // ---------------------------------------------------------
  // Parse and fill template (in-memory)
  // ---------------------------------------------------------
  // A fugly verbose hack to please the typechecker until it smartens up and recognizes overloads properly in this context
  if (_probe === 'XML') return createReportBrowser(newOptions, 'XML');
  if (_probe === 'JS') return createReportBrowser(newOptions, 'JS');
  return createReportBrowser(newOptions);
};

// ==========================================
// Public API
// ==========================================
export default createReport;
