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

  // note: the name 'message' is used by Error internally. We don't want to override it.
  msg: string;
  constructor(msg: string, command: string) {
    super(`Error executing command '${command}'. ${msg}`);
    Object.setPrototypeOf(this, CommandExecutionError.prototype);
    this.command = command;
    this.msg = msg;
  }
}

export class ImageError extends CommandExecutionError {}

export class InternalError extends Error {
  message = 'INTERNAL ERROR';
}

export class TemplateParseError extends Error {}
