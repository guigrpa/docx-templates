declare type LogSink = (message?: any, ...optionalParams: any[]) => void;
export declare const logger: {
    debug: LogSink;
};
export declare function setDebugLogSink(f: LogSink): void;
export {};
