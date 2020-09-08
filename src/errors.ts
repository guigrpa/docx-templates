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
    super(`Error executing command '${command}'. ${err.toString()}`);
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
