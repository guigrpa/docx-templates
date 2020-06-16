type LogSink = (message?: any, ...optionalParams: any[]) => void;

export const logger: {
  debug: LogSink;
} = { debug: () => {} };

export function setDebugLogSink(f: LogSink) {
  logger.debug = f;
}
