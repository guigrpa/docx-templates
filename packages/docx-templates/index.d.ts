declare const createReport: (options: UserOptions) => Promise<Buffer | null>;

interface UserOptions {
  template: string | ArrayBuffer; // path
  data?: ReportData | QueryResolver;
  queryVars?: any;
  output?: string;
  cmdDelimiter?: string | [string, string];
  literalXmlDelimiter?: string;
  processLineBreaks?: boolean; // true by default
  noSandbox?: boolean;
  runJs?: ({
    sandbox,
    ctx,
  }) => {
    modifiedSandbox: any;
    result: any;
  };
  additionalJsContext?: any;
  _probe?: 'JS' | 'XML';
}
type Query = string;
type QueryResolver = (
  query?: Query,
  queryVars?: any
) => ReportData | Promise<ReportData>;
type ReportData = any;

export default createReport;
