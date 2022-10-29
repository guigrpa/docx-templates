type LogSink = (message?: string, ...optionalParams: unknown[]) => void;

export const logger: {
  debug: LogSink;
} = { debug: () => {} };

export function setDebugLogSink(f: LogSink) {
  logger.debug = f;
}
