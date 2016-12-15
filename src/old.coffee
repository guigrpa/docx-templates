# WordReports (object)
# ====================

_             = require 'lodash'
Promise       = require 'bluebird'
fs            = require 'fs-extra'
fstream       = require 'fstream'
unzip         = require 'unzip'
archiver      = require 'archiver'
moment        = require 'moment'
path          = require 'path'
sax           = require 'sax'
db            = require './db'
argv          = require './argv'
gqlSchema     = require './gqlSchema'
log           = require('./log') 'wordReports'

fsPromises = {}
_.each ['ensureDir', 'emptyDir', 'copy', 'readFile', 'writeFile', 'unlink', 'remove'], (fn) ->
  fsPromises[fn] = Promise.promisify fs[fn]

#---------------------------------------------------------
# ## Report generation (export to Word)
#---------------------------------------------------------
ESCAPE_SEQUENCE = '+++'
DEBUG = false

_processReport = (data, template) ->
  out = _cloneNodeWithoutChildren template
  ctx =
    level:          1
    fCmd:           false
    cmd:            ''
    fSeekQuery:     false
    buffers:
      "w:p":        {text: '', cmds: '', fInsertedText: false}
      "w:tr":       {text: '', cmds: '', fInsertedText: false}
    vars:           {}
    loops:          []
    root:           template
    pendingCmd:     null
    skipAtLevel:    null
    shorthands:     {}
  nodeIn  = template
  nodeOut = out

  while true

    # Fetch a new node, case 1: go down...
    #-------------------------------------
    if nodeIn._children.length
      nodeIn = nodeIn._children[0]
      ctx.level++

    # Fetch a new node, case 2: go to the next sibling
    # (at the same level or a higher one)
    #-------------------------------------------------
    else
      fFound = false
      while nodeIn._parent?
        if _hasNextSibling nodeIn
          fFound = true
          nodeIn = _getNextSibling nodeIn
          break
        nodeIn  = nodeIn._parent
        nodeOut = nodeOut._parent
        ctx.level--

        # On the way up, process commands applicable at `w:p` (paragraph) and
        # `w:tr` (table row) level
        tag = nodeIn._tag
        if (tag is 'w:p' and ctx.pendingCmd?.name in ['FOR', 'END-FOR']) or
           (tag is 'w:tr' and ctx.pendingCmd?.name in ['FOR-ROW', 'END-FOR-ROW'])
          cmdName = ctx.pendingCmd.name
          switch cmdName
            when 'FOR', 'FOR-ROW'
              loopOver = ctx.pendingCmd.loopOver
              varName  = ctx.pendingCmd.varName
              if DEBUG then log.debug "Loop #{varName} iterations: #{loopOver.length}"
              if not ctx.skipAtLevel?
                {nextItem, curIdx} = _getNextItem loopOver
                if nextItem
                  ctx.loops.push {forNode: nodeIn, varName, loopOver, idx: curIdx}
                  ctx.vars[varName] = _.clone nextItem
                  ctx.vars[varName]._idx = curIdx + 1
                else
                  ctx.skipAtLevel = ctx.level
            when 'END-FOR', 'END-FOR-ROW'
              if ctx.level is ctx.skipAtLevel
                ctx.skipAtLevel = null
              else if not ctx.skipAtLevel?
                curLoop = _.last ctx.loops
                {forNode, varName, loopOver, idx} = curLoop
                {nextItem, curIdx} = _getNextItem loopOver, idx
                if nextItem                       # repeat loop
                  if DEBUG then log.debug "  - Iteration on #{varName}: #{idx + 1}"
                  curLoop.idx = curIdx
                  ctx.vars[varName] = _.clone nextItem
                  ctx.vars[varName]._idx = curIdx + 1
                  nodeIn = forNode
                else                              # loop finished
                  ctx.loops.pop()
          ctx.pendingCmd = null

        # On the way up, delete corresponding output node if the user inserted a paragraph
        # (or table row) with just a command, or if we're skipping nodes due to an empty FOR loop
        fRemoveNode = false
        if (tag in ['w:p', 'w:tbl', 'w:tr']) and ctx.skipAtLevel? and (ctx.level >= ctx.skipAtLevel)
          fRemoveNode = true
        else if tag in ['w:p', 'w:tr']
          buffers = ctx.buffers[tag]
          ## console.log "#{tag} FULLTEXT: '#{buffers.text}'"
          ## console.log "#{tag} COMMANDS: '#{buffers.cmds}'"
          fRemoveNode = _.isEmpty(buffers.text) and not _.isEmpty(buffers.cmds) and not buffers.fInsertedText
        if fRemoveNode
          nodeOut._parent._children.pop()

      # Reached the parent and still no luck? We're done generating the report!
      if not fFound then break

      # In the output tree, move up one level, to correct the attachment point
      # for the new node
      nodeOut = nodeOut._parent

    # Process node
    # ------------
    # Nodes are copied to the new tree, but that doesn't mean they will be kept there.
    # In some cases, they will be removed later on; for example, when a paragraph only
    # contained a command -- it will be deleted.
    tag = nodeIn._tag
    if tag in ['w:p', 'w:tr']
      ctx.buffers[tag] = {text: '', cmds: '', fInsertedText: false}
    newNode = _cloneNodeWithoutChildren nodeIn
    newNode._parent = nodeOut
    if nodeIn._fTextNode
      newNode._text = _processText data, nodeIn, ctx
    nodeOut._children.push newNode
    nodeOut = newNode

  out

# Go through the document until the query string is found (normally at the beginning)
_getQuery = (template) ->
  ctx =
    fCmd:           false
    cmd:            ''
    fSeekQuery:     true     # ensure no command will be processed, except QUERY
    query:          null
  nodeIn = template
  while true
    if nodeIn._children.length
      nodeIn = nodeIn._children[0]
    else
      fFound = false
      while nodeIn._parent?
        if _hasNextSibling nodeIn
          fFound = true
          nodeIn = _getNextSibling nodeIn
          break
        nodeIn  = nodeIn._parent
      if not fFound then break
    if nodeIn._fTextNode then _processText null, nodeIn, ctx
    if ctx.query? then break
  if not ctx.query?
    log.error "Query could not be found in the template"
    throw new Error 'Query could not be found in the template'
  ctx.query = _addIsDeleted ctx.query
  if DEBUG then log.debug "After adding isDeleted: " + ctx.query
  ctx.query

_addIsDeleted = (query) ->
  out = ""
  parens = 0
  level = 0
  fQuoted = false
  for c in query
    moreChars = c
    switch c
      when '(' then parens++
      when ')' then parens--
      when '"' then fQuoted = not fQuoted
      when '{'
        level++
        if level >= 2 and not parens and not fQuoted
          moreChars = '{isDeleted, '
      when '}' then level--
    out += moreChars
  out

_processText = (data, node, ctx) ->
  text = node._text
  return text if _.isEmpty text
  segments    = text.split ESCAPE_SEQUENCE
  outText     = ""
  idx         = 0
  fAppendText = node._parent?._tag is 'w:t'
  for idx in [0...segments.length]

    # Include the separators in the `buffers` field (used for deleting paragraphs if appropriate)
    if idx > 0 and fAppendText
      _appendText ESCAPE_SEQUENCE, ctx, {fCmd: true}

    # Append segment either to the `ctx.cmd` buffer (to be executed), if we are in "command mode",
    # or to the output text
    segment = segments[idx]
    ## log.debug "Token: '#{segment}'' (#{ctx.fCmd})"
    if ctx.fCmd then ctx.cmd += segment
    else             outText += segment
    if fAppendText then _appendText segment, ctx, {fCmd: ctx.fCmd}

    # If there are more segments, execute the command (if we are in "command mode"),
    # and toggle "command mode"
    if idx < segments.length - 1
      if ctx.fCmd
        cmdResultText = _processCmd data, ctx
        if cmdResultText?
          outText += cmdResultText
          if fAppendText
            _appendText cmdResultText, ctx, {fCmd: false, fInsertedText: true}
      ctx.fCmd = not ctx.fCmd
  outText

_processCmd = (data, ctx) ->
  cmd = _.trim ctx.cmd
  ctx.cmd = ''
  if DEBUG then log.debug "Executing: #{cmd}"
  shorthandName = /^\[(.+)\]$/.exec(cmd)?[1]
  if shorthandName?
    cmd = ctx.shorthands[shorthandName]
    if DEBUG then log.debug "Shorthand for: #{cmd}"
  cmd = cmd.replace /\s+/g, ' '
  tokens = cmd.split ' '
  if not tokens.length
    log.error "Invalid command syntax: #{cmd}"
    throw new Error 'Invalid command syntax'
  cmdName = tokens[0].toUpperCase()
  if ctx.fSeekQuery
    if cmdName is 'QUERY' then ctx.query = tokens.slice(1).join ' '
    return
  out = undefined
  switch cmdName
    when 'QUERY' then if DEBUG then log.debug "Ignoring QUERY command"
    when 'SHORTHAND'
      shorthandName = tokens[1]
      fullCmd = tokens.slice(2).join ' '
      ctx.shorthands[shorthandName] = fullCmd
      if DEBUG then log.debug "Defined shorthand '#{shorthandName}' as: #{fullCmd}"
    when 'VAR'                          # VAR <varName> <dataPath>
      varName = tokens[1]
      varPath = tokens[2]
      varValue = _extractFromData data, varPath, ctx
      ctx.vars[varName] = varValue
      ## log.debug "#{varName} is now: #{JSON.stringify varValue}"
    when 'FOR', 'FOR-ROW', 'FOR-COL'    # FOR <varName> IN <collectionDataPath>
      ctx.pendingCmd =
        name:     cmdName
        varName:  tokens[1]
        loopOver: _extractFromData data, tokens[3], ctx
    when 'END-FOR', 'END-FOR-ROW', 'END-FOR-COL'  # END-FOR
      ctx.pendingCmd = {name: cmdName}
    when 'INS'                          # INS <scalarDataPath>
      if not ctx.skipAtLevel?
        out = _extractFromData data, tokens[1], ctx
    else
      log.error "Invalid command syntax: #{cmd}"
      throw new Error 'Invalid command syntax'
  out

_appendText = (text, ctx, options) ->
  return if ctx.fSeekQuery
  {fCmd} = options
  type = if fCmd then 'cmds' else 'text'
  for key, buf of ctx.buffers
    ctx.buffers[key][type] += text
    if options.fInsertedText then ctx.buffers[key].fInsertedText = true

_extractFromData = (data, dataPath, ctx) ->
  parts = dataPath.split '.'
  if parts[0][0] is '$'
    varName = parts[0].substring(1)
    out = ctx.vars[varName]
    parts.shift()
  else
    out = data
  if not out? then return ''
  for part in parts
    out = out[part]
    if not out? then return ''
  out

_getNextItem = (items, curIdx = -1) ->
  nextItem = null
  while not nextItem?
    curIdx++
    break if curIdx >= items.length
    continue if items[curIdx].isDeleted
    nextItem = items[curIdx]
  {nextItem, curIdx}

#---------------------------------------------------------
# ## Utilities: conversion XML <-> JSON
#---------------------------------------------------------
_parseXml = (templateXml) ->
  parser = sax.parser true,    # true for XML-like (false for HTML-like)
    trim:       false
    normalize:  false
  template = null
  curNode = null
  numXmlElements = 0
  promise = new Promise (resolve, reject) ->
    parser.onopentag = (node) ->
      newNode =
        _parent:    curNode
        _children:  []
        _idxChild:  curNode?._children.length
        _fTextNode: false
        _tag:       node.name
        _attrs:     node.attributes
      if curNode? then  curNode._children.push newNode
      else              template = newNode
      curNode = newNode
      numXmlElements++
    parser.onclosetag = -> curNode = curNode._parent
    parser.ontext = (text) ->
      return if not curNode?
      curNode._children.push
        _parent:    curNode
        _children:  []
        _idxChild:  curNode._children.length
        _fTextNode: true
        _text:      text
    parser.onend = ->
      log.debug "Number of XML elements: #{numXmlElements}"
      resolve template
    parser.onerror = (err) -> reject err
    parser.write templateXml
    parser.end()
  promise

# TODO: escape XML-invalid characters!!!
_buildXml = (node, prefix = '') ->
  xml = if prefix is '' then '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' else ''
  if node._fTextNode
    xml += "#{node._text}"
  else
    attrs = ""
    for key, val of node._attrs
      attrs += " #{key}=\"#{val}\""
    fHasChildren = node._children.length > 0
    suffix = if fHasChildren then '' else '/'
    xml += "\n#{prefix}<#{node._tag}#{attrs}#{suffix}>"
    fLastChildIsNode = false
    for child in node._children
      xml += _buildXml child, prefix + '  '
      fLastChildIsNode = not child._fTextNode
    if fHasChildren
      prefix2 = if fLastChildIsNode then "\n#{prefix}" else ''
      xml += "#{prefix2}</#{node._tag}#{suffix}>"
  xml

#---------------------------------------------------------
# ## Utilities: miscellaneous
#---------------------------------------------------------
_cloneNodeWithoutChildren = (node) ->
  out = _.extend _.pick(node, ['_tag', '_attrs', '_fTextNode', '_text']),
    _parent:    null
    _children:  []
  out

_hasNextSibling = (node) ->
  return false if not node._parent?
  return node._idxChild < node._parent._children.length - 1

_getNextSibling = (node) -> node._parent._children[node._idxChild + 1]


#---------------------------------------------------------
# ## Utilities: debugging
#---------------------------------------------------------
_log = (node, prefix = '') ->
  if node._fTextNode
    log.debug "#{prefix}'#{node._text}'"
  else
    suffix = if node._children.length then '' else '/'
    log.debug "#{prefix}<#{node._tag}#{suffix}>"
    for child in node._children
      _log child, prefix + '  '
  node

#---------------------------------------------------------
# ## Utilities: zip/unzip
#---------------------------------------------------------
_unzip = (inputFile, outputFolder) ->
  readStream = fs.createReadStream inputFile
  writeStream = fstream.Writer outputFolder
  promise = new Promise (resolve, reject) ->
    readStream
    .pipe unzip.Parse()
    .pipe writeStream
    .on 'close', -> resolve()
  promise

_zip = (inputFolder, outputFile) ->
  output = fs.createWriteStream outputFile
  archive = archiver 'zip'
  promise = new Promise (resolve, reject) ->
    output.on 'close', -> resolve()
    archive.on 'error', (err) -> reject err
    archive.pipe output
    archive.bulk [{expand: true, dot: true, cwd: inputFolder, src: "**"}]
    archive.finalize()
  promise


module.exports =

  #---------------------------------------------------------
  # ## Export to Word
  #---------------------------------------------------------
  exportToWord: (msg) ->
    {queryVars, template} = msg.data
    fDefaultTemplate = _.isString template
    if fDefaultTemplate
      log.debug "Default template: #{template}"
    else
      log.debug "Received file with #{template.length} bytes..."
    uploadFolder = path.join process.cwd(), argv.userFiles, 'upload'
    fileId = moment().format('YYYYMMDD-HHmmSS-SSS')
    base = path.join uploadFolder, fileId
    result = {}
    jsTemplate = null
    queryResult = null
    templatePath = "#{base}_unzipped/word/document.xml"
    tic = null
    Promise.resolve()
    .then -> fsPromises.ensureDir uploadFolder

    # Save uploaded file or copy default file
    .then ->
      if fDefaultTemplate
        srcFile  = path.join process.cwd(), argv.main, 'wordTemplates', template
        destFile = "#{base}_in"
        promise = fsPromises.copy srcFile, destFile
      else
        promise = fsPromises.writeFile "#{base}_in", template
      promise

    # Unzip
    .then ->
      log.debug "Unzipping..."
      fsPromises.emptyDir "#{base}_unzipped"
      .then -> _unzip "#{base}_in", "#{base}_unzipped"
      .finally -> fsPromises.unlink "#{base}_in"

    # Read the 'document.xml' file (the template) and parse it
    .then ->
      log.debug "Reading template..."
      tic = null
      promise = fsPromises.readFile templatePath, 'utf8'
      .then (templateXml) ->
        log.debug "Template file length: #{templateXml.length}"
        log.debug "Parsing XML..."
        tic = new Date().getTime()
        return _parseXml(templateXml)
      .then (parseResult) ->
        jsTemplate = parseResult
        tac = new Date().getTime()
        log.debug "File parsed in #{tac-tic} ms"
        if DEBUG then _log jsTemplate
      promise

    # Fetch data that will fill in the template
    .then ->
      log.debug "Looking for the query in the template..."
      query = _getQuery jsTemplate
      log.debug "Running query..."
      log.debug "- Query: #{query}"
      log.debug "- Query vars: #{JSON.stringify queryVars}"
      promise = gqlSchema.do query, null, queryVars
      .then (res) ->
        if DEBUG then log.debug JSON.stringify res
        if res.errors?
          log.error error for error in res.errors
          throw new Error "GraphQL errors! (see log)"
        queryResult = res.data
      promise

    # Generate the report
    .then ->
      log.debug "Generating report..."
      report = _processReport queryResult, jsTemplate
      ## if DEBUG then _log report
      report

    # Build output XML and write it to disk
    .then (report) ->
      log.debug "Converting report to XML..."
      reportXml = _buildXml report
      log.debug "Writing report..."
      return fsPromises.writeFile templatePath, reportXml

    # Zip the results
    .then ->
      log.debug "Zipping..."
      _zip "#{base}_unzipped", "#{base}.docx"
      .then (data) ->
        result.responseData = "/upload/#{fileId}.docx"
        result
      .finally ->
        fsPromises.remove "#{base}_unzipped"
        result

    .catch (err) ->
      if err instanceof TypeError or err instanceof ReferenceError or err instanceof SyntaxError
        log.error err.stack
      throw new Error 'REPORT_ERROR'
