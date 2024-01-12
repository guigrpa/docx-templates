import { LoopStatus } from './types';

/**
 * Thrown when `rejectNullish` is set to `true` and a command returns `null` or `undefined`.
 */
export class NullishCommandResultError extends Error {
  command: string;
  constructor(command: string) {
    super(
      `Result of command ${command} is null or undefined and rejectNullish is set`
    );
    Object.setPrototypeOf(this, NullishCommandResultError.prototype);
    this.command = command;
  }
}

/**
 * Thrown when the result of an `INS` command is an `Object`. This ensures you don't accidentally put `'[object Object]'` in your report.
 */
export class ObjectCommandResultError extends Error {
  command: string;
  result: unknown;
  constructor(command: string, result: unknown) {
    super(`Result of command '${command}' is an object`);
    Object.setPrototypeOf(this, ObjectCommandResultError.prototype);
    this.command = command;
    this.result = result;
  }
}

export class CommandSyntaxError extends Error {
  command: string;
  constructor(command: string) {
    super(`Invalid command syntax: ${command}`);
    Object.setPrototypeOf(this, CommandSyntaxError.prototype);
    this.command = command;
  }
}

export class InvalidCommandError extends Error {
  command: string;
  constructor(msg: string, command: string) {
    super(`${msg}: ${command}`);
    Object.setPrototypeOf(this, InvalidCommandError.prototype);
    this.command = command;
  }
}

export class CommandExecutionError extends Error {
  command: string;
  err: Error;
  constructor(err: Error, command: string) {
    super(`Error executing command '${command}': ${err.message}`);
    Object.setPrototypeOf(this, CommandExecutionError.prototype);
    this.command = command;
    this.err = err;
  }
}

export class ImageError extends CommandExecutionError {}

export class InternalError extends Error {
  constructor(msg: string) {
    super(`INTERNAL ERROR: ${msg}`);
  }
}

export class TemplateParseError extends Error {}

export class IncompleteConditionalStatementError extends Error {
  constructor() {
    super(
      'Incomplete IF/END-IF statement. Make sure each IF-statement has a corresponding END-IF command.'
    );
  }
}

export class UnterminatedForLoopError extends Error {
  constructor(loop: LoopStatus) {
    super(
      `Unterminated FOR-loop ('FOR ${loop.varName}'). Make sure each FOR loop has a corresponding END-FOR command.`
    );
  }
}
