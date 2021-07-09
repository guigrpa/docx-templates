/**
 * Thrown when `rejectNullish` is set to `true` and a command returns `null` or `undefined`.
 */
export declare class NullishCommandResultError extends Error {
    command: string;
    constructor(command: string);
}
/**
 * Thrown when the result of an `INS` command is an `Object`. This ensures you don't accidentally put `'[object Object]'` in your report.
 */
export declare class ObjectCommandResultError extends Error {
    command: string;
    constructor(command: string);
}
export declare class CommandSyntaxError extends Error {
    command: string;
    constructor(command: string);
}
export declare class InvalidCommandError extends Error {
    command: string;
    constructor(msg: string, command: string);
}
export declare class CommandExecutionError extends Error {
    command: string;
    err: Error;
    constructor(err: Error, command: string);
}
export declare class ImageError extends CommandExecutionError {
}
export declare class InternalError extends Error {
    constructor(msg: string);
}
export declare class TemplateParseError extends Error {
}
