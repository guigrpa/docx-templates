(function (global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined'){
    module.exports = factory()
    module.exports.default = factory()
  } else if(typeof define === 'function' && define.amd) {
    define(factory)
  } else {
    global = global || self
    global.createReport = factory();
  }
}(this, function () {
  return require('./mainNode').default;
}))