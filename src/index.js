import { clone } from 'timm';

const Promise = require('bluebird');
const fs = require('fs-extra');
const fstream = require('fstream');
const unzip = require('unzip');
const archiver = require('archiver');
const moment = require('moment');
const path = require('path');
const sax = require('sax');
const db = require('./db');
const argv = require('./argv');
const gqlSchema = require('./gqlSchema');
const log = require('./log')('wordReports');

const DEBUG = false;

const log = DEBUG ? require('storyboard/withConsoleListener').mainStory : null;

const fsPromises = {};
['ensureDir', 'emptyDir', 'copy', 'readFile', 'writeFile', 'unlink', 'remove'].forEach((fn) => {
  fsPromises[fn] = Promise.promisify(fs[fn]);
});

ESCAPE_SEQUENCE = '+++';


_processReport = function(data, template) {
  var buffers, cmdName, ctx, curIdx, curLoop, fFound, fRemoveNode, forNode, idx, loopOver, newNode, nextItem, nodeIn, nodeOut, out, ref, ref1, ref2, ref3, ref4, ref5, tag, varName;
  out = _cloneNodeWithoutChildren(template);
  ctx = {
    level: 1,
    fCmd: false,
    cmd: '',
    fSeekQuery: false,
    buffers: {
      "w:p": {
        text: '',
        cmds: '',
        fInsertedText: false
      },
      "w:tr": {
        text: '',
        cmds: '',
        fInsertedText: false
      }
    },
    vars: {},
    loops: [],
    root: template,
    pendingCmd: null,
    skipAtLevel: null,
    shorthands: {}
  };
  nodeIn = template;
  nodeOut = out;
  while (true) {
    if (nodeIn._children.length) {
      nodeIn = nodeIn._children[0];
      ctx.level++;
    } else {
      fFound = false;
      while (nodeIn._parent != null) {
        if (_hasNextSibling(nodeIn)) {
          fFound = true;
          nodeIn = _getNextSibling(nodeIn);
          break;
        }
        nodeIn = nodeIn._parent;
        nodeOut = nodeOut._parent;
        ctx.level--;
        tag = nodeIn._tag;
        if ((tag === 'w:p' && ((ref = (ref1 = ctx.pendingCmd) != null ? ref1.name : void 0) === 'FOR' || ref === 'END-FOR')) || (tag === 'w:tr' && ((ref2 = (ref3 = ctx.pendingCmd) != null ? ref3.name : void 0) === 'FOR-ROW' || ref2 === 'END-FOR-ROW'))) {
          cmdName = ctx.pendingCmd.name;
          switch (cmdName) {
            case 'FOR':
            case 'FOR-ROW':
              loopOver = ctx.pendingCmd.loopOver;
              varName = ctx.pendingCmd.varName;
              if (DEBUG) {
                log.debug("Loop " + varName + " iterations: " + loopOver.length);
              }
              if (ctx.skipAtLevel == null) {
                ref4 = _getNextItem(loopOver), nextItem = ref4.nextItem, curIdx = ref4.curIdx;
                if (nextItem) {
                  ctx.loops.push({
                    forNode: nodeIn,
                    varName: varName,
                    loopOver: loopOver,
                    idx: curIdx
                  });
                  ctx.vars[varName] = _.clone(nextItem);
                  ctx.vars[varName]._idx = curIdx + 1;
                } else {
                  ctx.skipAtLevel = ctx.level;
                }
              }
              break;
            case 'END-FOR':
            case 'END-FOR-ROW':
              if (ctx.level === ctx.skipAtLevel) {
                ctx.skipAtLevel = null;
              } else if (ctx.skipAtLevel == null) {
                curLoop = _.last(ctx.loops);
                forNode = curLoop.forNode, varName = curLoop.varName, loopOver = curLoop.loopOver, idx = curLoop.idx;
                ref5 = _getNextItem(loopOver, idx), nextItem = ref5.nextItem, curIdx = ref5.curIdx;
                if (nextItem) {
                  if (DEBUG) {
                    log.debug("  - Iteration on " + varName + ": " + (idx + 1));
                  }
                  curLoop.idx = curIdx;
                  ctx.vars[varName] = _.clone(nextItem);
                  ctx.vars[varName]._idx = curIdx + 1;
                  nodeIn = forNode;
                } else {
                  ctx.loops.pop();
                }
              }
          }
          ctx.pendingCmd = null;
        }
        fRemoveNode = false;
        if ((tag === 'w:p' || tag === 'w:tbl' || tag === 'w:tr') && (ctx.skipAtLevel != null) && (ctx.level >= ctx.skipAtLevel)) {
          fRemoveNode = true;
        } else if (tag === 'w:p' || tag === 'w:tr') {
          buffers = ctx.buffers[tag];
          fRemoveNode = _.isEmpty(buffers.text) && !_.isEmpty(buffers.cmds) && !buffers.fInsertedText;
        }
        if (fRemoveNode) {
          nodeOut._parent._children.pop();
        }
      }
      if (!fFound) {
        break;
      }
      nodeOut = nodeOut._parent;
    }
    tag = nodeIn._tag;
    if (tag === 'w:p' || tag === 'w:tr') {
      ctx.buffers[tag] = {
        text: '',
        cmds: '',
        fInsertedText: false
      };
    }
    newNode = _cloneNodeWithoutChildren(nodeIn);
    newNode._parent = nodeOut;
    if (nodeIn._fTextNode) {
      newNode._text = _processText(data, nodeIn, ctx);
    }
    nodeOut._children.push(newNode);
    nodeOut = newNode;
  }
  return out;
};

_getQuery = function(template) {
  var ctx, fFound, nodeIn;
  ctx = {
    fCmd: false,
    cmd: '',
    fSeekQuery: true,
    query: null
  };
  nodeIn = template;
  while (true) {
    if (nodeIn._children.length) {
      nodeIn = nodeIn._children[0];
    } else {
      fFound = false;
      while (nodeIn._parent != null) {
        if (_hasNextSibling(nodeIn)) {
          fFound = true;
          nodeIn = _getNextSibling(nodeIn);
          break;
        }
        nodeIn = nodeIn._parent;
      }
      if (!fFound) {
        break;
      }
    }
    if (nodeIn._fTextNode) {
      _processText(null, nodeIn, ctx);
    }
    if (ctx.query != null) {
      break;
    }
  }
  if (ctx.query == null) {
    log.error("Query could not be found in the template");
    throw new Error('Query could not be found in the template');
  }
  ctx.query = _addIsDeleted(ctx.query);
  if (DEBUG) {
    log.debug("After adding isDeleted: " + ctx.query);
  }
  return ctx.query;
};

_addIsDeleted = function(query) {
  var c, fQuoted, i, len, level, moreChars, out, parens;
  out = "";
  parens = 0;
  level = 0;
  fQuoted = false;
  for (i = 0, len = query.length; i < len; i++) {
    c = query[i];
    moreChars = c;
    switch (c) {
      case '(':
        parens++;
        break;
      case ')':
        parens--;
        break;
      case '"':
        fQuoted = !fQuoted;
        break;
      case '{':
        level++;
        if (level >= 2 && !parens && !fQuoted) {
          moreChars = '{isDeleted, ';
        }
        break;
      case '}':
        level--;
    }
    out += moreChars;
  }
  return out;
};

_processText = function(data, node, ctx) {
  var cmdResultText, fAppendText, i, idx, outText, ref, ref1, segment, segments, text;
  text = node._text;
  if (_.isEmpty(text)) {
    return text;
  }
  segments = text.split(ESCAPE_SEQUENCE);
  outText = "";
  idx = 0;
  fAppendText = ((ref = node._parent) != null ? ref._tag : void 0) === 'w:t';
  for (idx = i = 0, ref1 = segments.length; 0 <= ref1 ? i < ref1 : i > ref1; idx = 0 <= ref1 ? ++i : --i) {
    if (idx > 0 && fAppendText) {
      _appendText(ESCAPE_SEQUENCE, ctx, {
        fCmd: true
      });
    }
    segment = segments[idx];
    if (ctx.fCmd) {
      ctx.cmd += segment;
    } else {
      outText += segment;
    }
    if (fAppendText) {
      _appendText(segment, ctx, {
        fCmd: ctx.fCmd
      });
    }
    if (idx < segments.length - 1) {
      if (ctx.fCmd) {
        cmdResultText = _processCmd(data, ctx);
        if (cmdResultText != null) {
          outText += cmdResultText;
          if (fAppendText) {
            _appendText(cmdResultText, ctx, {
              fCmd: false,
              fInsertedText: true
            });
          }
        }
      }
      ctx.fCmd = !ctx.fCmd;
    }
  }
  return outText;
};

_processCmd = function(data, ctx) {
  var cmd, cmdName, fullCmd, out, ref, shorthandName, tokens, varName, varPath, varValue;
  cmd = _.trim(ctx.cmd);
  ctx.cmd = '';
  if (DEBUG) {
    log.debug("Executing: " + cmd);
  }
  shorthandName = (ref = /^\[(.+)\]$/.exec(cmd)) != null ? ref[1] : void 0;
  if (shorthandName != null) {
    cmd = ctx.shorthands[shorthandName];
    if (DEBUG) {
      log.debug("Shorthand for: " + cmd);
    }
  }
  cmd = cmd.replace(/\s+/g, ' ');
  tokens = cmd.split(' ');
  if (!tokens.length) {
    log.error("Invalid command syntax: " + cmd);
    throw new Error('Invalid command syntax');
  }
  cmdName = tokens[0].toUpperCase();
  if (ctx.fSeekQuery) {
    if (cmdName === 'QUERY') {
      ctx.query = tokens.slice(1).join(' ');
    }
    return;
  }
  out = void 0;
  switch (cmdName) {
    case 'QUERY':
      if (DEBUG) {
        log.debug("Ignoring QUERY command");
      }
      break;
    case 'SHORTHAND':
      shorthandName = tokens[1];
      fullCmd = tokens.slice(2).join(' ');
      ctx.shorthands[shorthandName] = fullCmd;
      if (DEBUG) {
        log.debug("Defined shorthand '" + shorthandName + "' as: " + fullCmd);
      }
      break;
    case 'VAR':
      varName = tokens[1];
      varPath = tokens[2];
      varValue = _extractFromData(data, varPath, ctx);
      ctx.vars[varName] = varValue;
      break;
    case 'FOR':
    case 'FOR-ROW':
    case 'FOR-COL':
      ctx.pendingCmd = {
        name: cmdName,
        varName: tokens[1],
        loopOver: _extractFromData(data, tokens[3], ctx)
      };
      break;
    case 'END-FOR':
    case 'END-FOR-ROW':
    case 'END-FOR-COL':
      ctx.pendingCmd = {
        name: cmdName
      };
      break;
    case 'INS':
      if (ctx.skipAtLevel == null) {
        out = _extractFromData(data, tokens[1], ctx);
      }
      break;
    default:
      log.error("Invalid command syntax: " + cmd);
      throw new Error('Invalid command syntax');
  }
  return out;
};

_appendText = function(text, ctx, options) {
  var buf, fCmd, key, ref, results, type;
  if (ctx.fSeekQuery) {
    return;
  }
  fCmd = options.fCmd;
  type = fCmd ? 'cmds' : 'text';
  ref = ctx.buffers;
  results = [];
  for (key in ref) {
    buf = ref[key];
    ctx.buffers[key][type] += text;
    if (options.fInsertedText) {
      results.push(ctx.buffers[key].fInsertedText = true);
    } else {
      results.push(void 0);
    }
  }
  return results;
};

_extractFromData = function(data, dataPath, ctx) {
  var i, len, out, part, parts, varName;
  parts = dataPath.split('.');
  if (parts[0][0] === '$') {
    varName = parts[0].substring(1);
    out = ctx.vars[varName];
    parts.shift();
  } else {
    out = data;
  }
  if (out == null) {
    return '';
  }
  for (i = 0, len = parts.length; i < len; i++) {
    part = parts[i];
    out = out[part];
    if (out == null) {
      return '';
    }
  }
  return out;
};

_getNextItem = function(items, curIdx) {
  var nextItem;
  if (curIdx == null) {
    curIdx = -1;
  }
  nextItem = null;
  while (nextItem == null) {
    curIdx++;
    if (curIdx >= items.length) {
      break;
    }
    if (items[curIdx].isDeleted) {
      continue;
    }
    nextItem = items[curIdx];
  }
  return {
    nextItem: nextItem,
    curIdx: curIdx
  };
};

_parseXml = function(templateXml) {
  var curNode, numXmlElements, parser, promise, template;
  parser = sax.parser(true, {
    trim: false,
    normalize: false
  });
  template = null;
  curNode = null;
  numXmlElements = 0;
  promise = new Promise(function(resolve, reject) {
    parser.onopentag = function(node) {
      var newNode;
      newNode = {
        _parent: curNode,
        _children: [],
        _idxChild: curNode != null ? curNode._children.length : void 0,
        _fTextNode: false,
        _tag: node.name,
        _attrs: node.attributes
      };
      if (curNode != null) {
        curNode._children.push(newNode);
      } else {
        template = newNode;
      }
      curNode = newNode;
      return numXmlElements++;
    };
    parser.onclosetag = function() {
      return curNode = curNode._parent;
    };
    parser.ontext = function(text) {
      if (curNode == null) {
        return;
      }
      return curNode._children.push({
        _parent: curNode,
        _children: [],
        _idxChild: curNode._children.length,
        _fTextNode: true,
        _text: text
      });
    };
    parser.onend = function() {
      log.debug("Number of XML elements: " + numXmlElements);
      return resolve(template);
    };
    parser.onerror = function(err) {
      return reject(err);
    };
    parser.write(templateXml);
    return parser.end();
  });
  return promise;
};

_buildXml = function(node, prefix) {
  var attrs, child, fHasChildren, fLastChildIsNode, i, key, len, prefix2, ref, ref1, suffix, val, xml;
  if (prefix == null) {
    prefix = '';
  }
  xml = prefix === '' ? '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' : '';
  if (node._fTextNode) {
    xml += "" + node._text;
  } else {
    attrs = "";
    ref = node._attrs;
    for (key in ref) {
      val = ref[key];
      attrs += " " + key + "=\"" + val + "\"";
    }
    fHasChildren = node._children.length > 0;
    suffix = fHasChildren ? '' : '/';
    xml += "\n" + prefix + "<" + node._tag + attrs + suffix + ">";
    fLastChildIsNode = false;
    ref1 = node._children;
    for (i = 0, len = ref1.length; i < len; i++) {
      child = ref1[i];
      xml += _buildXml(child, prefix + '  ');
      fLastChildIsNode = !child._fTextNode;
    }
    if (fHasChildren) {
      prefix2 = fLastChildIsNode ? "\n" + prefix : '';
      xml += prefix2 + "</" + node._tag + suffix + ">";
    }
  }
  return xml;
};

_cloneNodeWithoutChildren = function(node) {
  var out;
  out = _.extend(_.pick(node, ['_tag', '_attrs', '_fTextNode', '_text']), {
    _parent: null,
    _children: []
  });
  return out;
};

_hasNextSibling = function(node) {
  if (node._parent == null) {
    return false;
  }
  return node._idxChild < node._parent._children.length - 1;
};

_getNextSibling = function(node) {
  return node._parent._children[node._idxChild + 1];
};

_log = function(node, prefix) {
  var child, i, len, ref, suffix;
  if (prefix == null) {
    prefix = '';
  }
  if (node._fTextNode) {
    log.debug(prefix + "'" + node._text + "'");
  } else {
    suffix = node._children.length ? '' : '/';
    log.debug(prefix + "<" + node._tag + suffix + ">");
    ref = node._children;
    for (i = 0, len = ref.length; i < len; i++) {
      child = ref[i];
      _log(child, prefix + '  ');
    }
  }
  return node;
};

_unzip = function(inputFile, outputFolder) {
  var promise, readStream, writeStream;
  readStream = fs.createReadStream(inputFile);
  writeStream = fstream.Writer(outputFolder);
  promise = new Promise(function(resolve, reject) {
    return readStream.pipe(unzip.Parse()).pipe(writeStream).on('close', function() {
      return resolve();
    });
  });
  return promise;
};

_zip = function(inputFolder, outputFile) {
  var archive, output, promise;
  output = fs.createWriteStream(outputFile);
  archive = archiver('zip');
  promise = new Promise(function(resolve, reject) {
    output.on('close', function() {
      return resolve();
    });
    archive.on('error', function(err) {
      return reject(err);
    });
    archive.pipe(output);
    archive.bulk([
      {
        expand: true,
        dot: true,
        cwd: inputFolder,
        src: "**"
      }
    ]);
    return archive.finalize();
  });
  return promise;
};

module.exports = {
  exportToWord: function(msg) {
    var base, fDefaultTemplate, fileId, jsTemplate, queryResult, queryVars, ref, result, template, templatePath, tic, uploadFolder;
    ref = msg.data, queryVars = ref.queryVars, template = ref.template;
    fDefaultTemplate = _.isString(template);
    if (fDefaultTemplate) {
      log.debug("Default template: " + template);
    } else {
      log.debug("Received file with " + template.length + " bytes...");
    }
    uploadFolder = path.join(process.cwd(), argv.userFiles, 'upload');
    fileId = moment().format('YYYYMMDD-HHmmSS-SSS');
    base = path.join(uploadFolder, fileId);
    result = {};
    jsTemplate = null;
    queryResult = null;
    templatePath = base + "_unzipped/word/document.xml";
    tic = null;
    return Promise.resolve().then(function() {
      return fsPromises.ensureDir(uploadFolder);
    }).then(function() {
      var destFile, promise, srcFile;
      if (fDefaultTemplate) {
        srcFile = path.join(process.cwd(), argv.main, 'wordTemplates', template);
        destFile = base + "_in";
        promise = fsPromises.copy(srcFile, destFile);
      } else {
        promise = fsPromises.writeFile(base + "_in", template);
      }
      return promise;
    }).then(function() {
      log.debug("Unzipping...");
      return fsPromises.emptyDir(base + "_unzipped").then(function() {
        return _unzip(base + "_in", base + "_unzipped");
      })["finally"](function() {
        return fsPromises.unlink(base + "_in");
      });
    }).then(function() {
      var promise;
      log.debug("Reading template...");
      tic = null;
      promise = fsPromises.readFile(templatePath, 'utf8').then(function(templateXml) {
        log.debug("Template file length: " + templateXml.length);
        log.debug("Parsing XML...");
        tic = new Date().getTime();
        return _parseXml(templateXml);
      }).then(function(parseResult) {
        var tac;
        jsTemplate = parseResult;
        tac = new Date().getTime();
        log.debug("File parsed in " + (tac - tic) + " ms");
        if (DEBUG) {
          return _log(jsTemplate);
        }
      });
      return promise;
    }).then(function() {
      var promise, query;
      log.debug("Looking for the query in the template...");
      query = _getQuery(jsTemplate);
      log.debug("Running query...");
      log.debug("- Query: " + query);
      log.debug("- Query vars: " + (JSON.stringify(queryVars)));
      promise = gqlSchema["do"](query, null, queryVars).then(function(res) {
        var error, i, len, ref1;
        if (DEBUG) {
          log.debug(JSON.stringify(res));
        }
        if (res.errors != null) {
          ref1 = res.errors;
          for (i = 0, len = ref1.length; i < len; i++) {
            error = ref1[i];
            log.error(error);
          }
          throw new Error("GraphQL errors! (see log)");
        }
        return queryResult = res.data;
      });
      return promise;
    }).then(function() {
      var report;
      log.debug("Generating report...");
      report = _processReport(queryResult, jsTemplate);
      return report;
    }).then(function(report) {
      var reportXml;
      log.debug("Converting report to XML...");
      reportXml = _buildXml(report);
      log.debug("Writing report...");
      return fsPromises.writeFile(templatePath, reportXml);
    }).then(function() {
      log.debug("Zipping...");
      return _zip(base + "_unzipped", base + ".docx").then(function(data) {
        result.responseData = "/upload/" + fileId + ".docx";
        return result;
      })["finally"](function() {
        fsPromises.remove(base + "_unzipped");
        return result;
      });
    })["catch"](function(err) {
      if (err instanceof TypeError || err instanceof ReferenceError || err instanceof SyntaxError) {
        log.error(err.stack);
      }
      throw new Error('REPORT_ERROR');
    });
  }
};
