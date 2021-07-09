"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateParseError = exports.InternalError = exports.ImageError = exports.CommandExecutionError = exports.InvalidCommandError = exports.CommandSyntaxError = exports.ObjectCommandResultError = exports.NullishCommandResultError = void 0;
/**
 * Thrown when `rejectNullish` is set to `true` and a command returns `null` or `undefined`.
 */
var NullishCommandResultError = /** @class */ (function (_super) {
    __extends(NullishCommandResultError, _super);
    function NullishCommandResultError(command) {
        var _this = _super.call(this, "Result of command " + command + " is null or undefined and rejectNullish is set") || this;
        Object.setPrototypeOf(_this, NullishCommandResultError.prototype);
        _this.command = command;
        return _this;
    }
    return NullishCommandResultError;
}(Error));
exports.NullishCommandResultError = NullishCommandResultError;
/**
 * Thrown when the result of an `INS` command is an `Object`. This ensures you don't accidentally put `'[object Object]'` in your report.
 */
var ObjectCommandResultError = /** @class */ (function (_super) {
    __extends(ObjectCommandResultError, _super);
    function ObjectCommandResultError(command) {
        var _this = _super.call(this, "Result of command '" + command + "' is an object") || this;
        Object.setPrototypeOf(_this, ObjectCommandResultError.prototype);
        _this.command = command;
        return _this;
    }
    return ObjectCommandResultError;
}(Error));
exports.ObjectCommandResultError = ObjectCommandResultError;
var CommandSyntaxError = /** @class */ (function (_super) {
    __extends(CommandSyntaxError, _super);
    function CommandSyntaxError(command) {
        var _this = _super.call(this, "Invalid command syntax: " + command) || this;
        Object.setPrototypeOf(_this, CommandSyntaxError.prototype);
        _this.command = command;
        return _this;
    }
    return CommandSyntaxError;
}(Error));
exports.CommandSyntaxError = CommandSyntaxError;
var InvalidCommandError = /** @class */ (function (_super) {
    __extends(InvalidCommandError, _super);
    function InvalidCommandError(msg, command) {
        var _this = _super.call(this, msg + ": " + command) || this;
        Object.setPrototypeOf(_this, InvalidCommandError.prototype);
        _this.command = command;
        return _this;
    }
    return InvalidCommandError;
}(Error));
exports.InvalidCommandError = InvalidCommandError;
var CommandExecutionError = /** @class */ (function (_super) {
    __extends(CommandExecutionError, _super);
    function CommandExecutionError(err, command) {
        var _this = _super.call(this, "Error executing command '" + command + "'. " + err.toString()) || this;
        Object.setPrototypeOf(_this, CommandExecutionError.prototype);
        _this.command = command;
        _this.err = err;
        return _this;
    }
    return CommandExecutionError;
}(Error));
exports.CommandExecutionError = CommandExecutionError;
var ImageError = /** @class */ (function (_super) {
    __extends(ImageError, _super);
    function ImageError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return ImageError;
}(CommandExecutionError));
exports.ImageError = ImageError;
var InternalError = /** @class */ (function (_super) {
    __extends(InternalError, _super);
    function InternalError(msg) {
        return _super.call(this, "INTERNAL ERROR: " + msg) || this;
    }
    return InternalError;
}(Error));
exports.InternalError = InternalError;
var TemplateParseError = /** @class */ (function (_super) {
    __extends(TemplateParseError, _super);
    function TemplateParseError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return TemplateParseError;
}(Error));
exports.TemplateParseError = TemplateParseError;
