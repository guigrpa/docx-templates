"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDebugLogSink = exports.logger = void 0;
exports.logger = { debug: function () { } };
function setDebugLogSink(f) {
    exports.logger.debug = f;
}
exports.setDebugLogSink = setDebugLogSink;
