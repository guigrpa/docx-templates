# Docx-templates [![Coverage Status](https://coveralls.io/repos/github/guigrpa/docx-templates/badge.svg?branch=master)](https://coveralls.io/github/guigrpa/docx-templates?branch=master) [![npm version](https://img.shields.io/npm/v/docx-templates.svg)](https://www.npmjs.com/package/docx-templates)

Template-based docx report creation for both Node and the browser. ([See the blog post](http://guigrpa.github.io/2017/01/01/word-docs-the-relay-way/)).


## Why?

* **Write documents naturally using Word**, just adding some commands where needed for dynamic contents
* **Express your data needs (queries) in the template itself** (`QUERY` command), in whatever query language you want (e.g. in GraphQL). This is similar to _the Relay way™_: in [Relay](https://facebook.github.io/relay/), data requirements are declared alongside the React components that need the data
* **Execute JavaScript snippets** (`EXEC` command, or `!` for short)
* **Insert the result of JavaScript snippets** in your document (`INS`, `=` or just *nothing*)
* **Embed images, hyperlinks and even HTML dynamically** (`IMAGE`, `LINK`, `HTML`). Dynamic images can be great for on-the-fly QR codes, downloading photos straight to your reports, charts… even maps!
* Add **loops** with `FOR`/`END-FOR` commands, with support for table rows, nested loops, and JavaScript processing of elements (filter, sort, etc)
* Include contents **conditionally**, `IF` a certain JavaScript expression is truthy
* Define custom **aliases** for some commands (`ALIAS`) — useful for writing table templates!
* Run all JavaScript in a **separate Node VM** or a user-provided sandbox.
* Include **literal XML**
* Written in TypeScript, so ships with type definitions.
* Plenty of **examples** in this repo (with Node, Webpack and Browserify)
* Supports `.docm` templates in addition to regular `.docx` files.

Contributions are welcome!

# Table of contents

- [Installation](#installation)
- [Node usage](#node-usage)
- [Deno usage](#deno-usage)
- [Browser usage](#browser-usage)
  - [Polyfilled browser-ready bundle](#polyfilled-browser-ready-bundle)
  - [Browser template compatibility caveat](#browser-template-compatibility-caveat)
  - [Running within a Web Worker](#running-within-a-web-worker)
- [Writing templates](#writing-templates)
  - [Custom command delimiters](#custom-command-delimiters)
  - [Supported commands](#supported-commands)
    - [`QUERY`](#query)
    - [`INS` (`=`, or nothing at all)](#ins--or-nothing-at-all)
    - [`EXEC` (`!`)](#exec-)
    - [`IMAGE`](#image)
    - [`LINK`](#link)
    - [`HTML`](#html)
    - [`FOR` and `END-FOR`](#for-and-end-for)
    - [`IF` and `END-IF`](#if-and-end-if)
    - [`ALIAS` (and alias resolution with `*`)](#alias-and-alias-resolution-with-)
  - [Inserting literal XML](#inserting-literal-xml)
- [Error handling](#error-handling)
  - [Error types](#error-types)
  - [Custom error handler](#custom-error-handler)
- [Inspecting templates](#inspecting-templates)
- [Performance & security](#performance--security)
- [Similar projects](#similar-projects)
- [License (MIT)](#license-mit)

# Installation

```
$ npm install docx-templates
```

...or using yarn:

```
$ yarn add docx-templates
```


# Node usage

Here is a simple example, with report data injected directly as an object:

```js
import createReport from 'docx-templates';
import fs from 'fs';

const template = fs.readFileSync('myTemplate.docx');

const buffer = await createReport({
  template,
  data: {
    name: 'John',
    surname: 'Appleseed',
  },
});

fs.writeFileSync('report.docx', buffer)
```

You can also **provide a sync or Promise-returning callback function (query resolver)** instead of a `data` object:

```js
const report = await createReport({
  template,
  data: query => graphqlServer.execute(query),
});
```

Your resolver callback will receive the query embedded in the template (in a `QUERY` command) as an argument.

Other options (with defaults):

```js
const report = await createReport({
  // ...
  additionalJsContext: {
    // all of these will be available to JS snippets in your template commands (see below)
    foo: 'bar',
    qrCode: async url => {
      /* build QR and return image data */
    },
  },
  cmdDelimiter: '+++',
    /* default for backwards compatibility; but even better: ['{', '}'] */
  literalXmlDelimiter: '||',
  processLineBreaks: true,
  noSandbox: false,

  /**
   * Whether to fail on the first error encountered in the template. Defaults to true. Can be used to collect all errors in a template (e.g. misspelled commands) before failing.
   */
  failFast: true,

  /**
   * When set to `true`, this setting ensures createReport throws an error when the result of an INS, HTML, IMAGE, or LINK command turns out to be null or undefined,
   * as this usually indicates a mistake in the template or the invoking code (defaults to `false`).
   */
  rejectNullish: false,

  /**
   * MS Word usually autocorrects JS string literal quotes with unicode 'smart' quotes ('curly' quotes). E.g. 'aubergine' -> ‘aubergine’.
   * This causes an error when evaluating commands containing these smart quotes, as they are not valid JavaScript.
   * If you set fixSmartQuotes to 'true', these smart quotes will automatically get replaced with straight quotes (') before command evaluation.
   * Defaults to false.
   */
  fixSmartQuotes: false;

  /**
   * Maximum loop iterations allowed when walking through the template.
   * You can increase this to generate reports with large amount of FOR loop elements.
   * Tip: You can disable infinite loop protection by using the `Infinity` constant.
   * This may be useful if you implement a process timeout instead.
   * (Default: 1,000,000)
   */
  maximumWalkingDepth: 1_000_000;
});
```

Check out the [Node examples folder](https://github.com/guigrpa/docx-templates/tree/master/examples/example-node).

# Deno usage
You can use docx-templates in Deno! Just follow the Browser guide and import the polyfilled docx-templates bundle, for example from unpkg:

```ts
// @deno-types="https://unpkg.com/docx-templates/lib/bundled.d.ts"
import { createReport } from 'https://unpkg.com/docx-templates/lib/browser.js';
```

> Note that you have to set `noSandbox: true` or bring your own sandbox with the `runJs` option.

# Browser usage

You can use docx-templates in the browser (yay!). Just as when using docx-templates in Node, you need to provide the template contents as a `Buffer`-like object. 

For example when the template is on your server you can get it with something like:

```js
const template = await fetch('./template.docx').then(res => res.arrayBuffer())
```

Or if the user provides the template you can get a `File` object with:

```html
<input type="file">
```

Then read this file in an ArrayBuffer, feed it to docx-templates, and download the result:

```js
import createReport from 'docx-templates';

const onTemplateChosen = async () => {
  const template = await readFileIntoArrayBuffer(myFile);
  const report = await createReport({
    template,
    data: { name: 'John', surname: 'Appleseed' },
  });
  saveDataToFile(
    report,
    'report.docx',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );
};

// Load the user-provided file into an ArrayBuffer
const readFileIntoArrayBuffer = fd =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsArrayBuffer(fd);
  });
```

You can find an example implementation of `saveDataToFile()` [in the Webpack example](https://github.com/guigrpa/docx-templates/blob/79119723ff1c009b5bbdd28016558da9b405742f/examples/example-webpack/client/index.js#L82).

Check out the examples [using Webpack](https://github.com/guigrpa/docx-templates/tree/master/examples/example-webpack) and [using Browserify](https://github.com/guigrpa/docx-templates/tree/master/examples/example-browserify) or you can use the browserified bundle directly as discussed below.

## Polyfilled browser-ready bundle
As this library depends on the internal NodeJS modules `vm`, `stream`, `util`, and `events`, your build tools have to polyfill these modules when using the library in the browser. We provide a browser build which includes the required polyfills. Its file size is about 300K uncompressed or 85K / 70K with gzip / brotli compression).

You can import the library directly **as a module** using e.g. the unpkg.com CDN, like below, or you can host the `/lib/browser.js` bundle yourself.

```ts
import { createReport } from 'https://unpkg.com/docx-templates/lib/browser.js';
```

this is good for testing or prototyping but you should keep in mind that the `browser.js` is `es2017` code which is supported by only 95% of users. If you have to support IE or old browser versions, you are better off compiling it to your target. Also see the support table for `es2017` [here](https://caniuse.com/sr_es8).

## Browser template compatibility caveat
Note that the JavaScript code in your .docx template will be run as-is by the browser. Transpilers like Babel can't see this code, and won't be able to polyfill it. This means that the JS code in your template needs to be compatible with the browsers you are targeting. In other words: don't use fancy modern syntax and functions in your template if you want older browsers, like IE11, to be able to render it.

## Running within a Web Worker
Note that you need to disable the sandbox mode using the `noSandbox: true` option to be able to run `createReport` from within a web worker. This is because the default sandbox mode browser polyfills require access to the `iframe` API, which is not available from a web worker context. Make sure you are aware of the security implications of disabling the sandbox.

# Writing templates

You can find several template examples in this repo:

* [SWAPI](https://github.com/guigrpa/docx-templates/tree/master/examples/example-node), a good example of what you can achieve embedding a template (GraphQL in this case) in your report, including a simple script for report generation. Uses the freak-ish online [Star Wars GraphQL API](https://github.com/graphql/swapi-graphql).
* [Dynamic images](https://github.com/guigrpa/docx-templates/tree/master/examples/example-node): with examples of images that are dynamically downloaded or created. Check out the _images-many-tiles_ example for a taste of this powerful feature.
* Browser-based examples [using Webpack](https://github.com/guigrpa/docx-templates/tree/master/examples/example-webpack) and [using Browserify](https://github.com/guigrpa/docx-templates/tree/master/examples/example-browserify).

## Custom command delimiters
You can use different **left/right command delimiters** by passing an array to `cmdDelimiter`:

```js
const report = await createReport({
  // ...
  cmdDelimiter: ['{', '}'],
})
```

This allows much cleaner-looking templates!

Then you can add commands and JS snippets in your template like this: `{foo}`, `{project.name}` `{QUERY ...}`, `{FOR ...}`.

When choosing a delimiter, take care not to introduce conflicts with JS syntax, especially if you are planning to use larger JS code snippets in your templates. For example, with `['{', '}']` you may run into conflicts as the brackets in your JS code may be mistaken for command delimiters. As an alternative, consider using multi-character delimiters, like `{#` and `#}` (see issue [#102](https://github.com/guigrpa/docx-templates/issues/102)).


## Supported commands
Currently supported commands are defined below.

### Insert data with the `INS` command ( or using `=`, or nothing at all)

Inserts the result of a given JavaScript snippet as follows.

Using code like this:
```js
 const report = await createReport({
    template,
    data: { name: 'John', surname: 'Appleseed' },
    cmdDelimiter: ['+++', '+++'],
  });
```
And a template like this:

```
+++name+++ +++surname+++
```

Will produce a result docx file that looks like this:

```
John Appleseed
```

Alternatively, you can use the more explicit `INS` (insert) command syntax.
```
+++INS name+++ +++INS surname+++
```

Note that the last evaluated expression is inserted into the document, so you can include more complex code if you wish:

```
+++INS
const a = Math.random();
const b = Math.round((a - 0.5) * 20);
`A number between -10 and 10: ${b}.`
+++
```

You can also use `=` as shorthand notation instead of `INS`:

```
+++= name+++ +++= surname+++
```

Even shorter (and with custom `cmdDelimiter: ['{', '}']`):

```
{name} {surname}
```

You can also access functions in the `additionalJsContext` parameter to `createReport()`, which may even return a Promise. The resolved value of the Promise will be inserted in the document.

Use JavaScript's ternary operator to implement an _if-else_ structure:

```
+++= $details.year != null ? `(${$details.year})` : ''+++
```

### `QUERY`

You can use GraphQL, SQL, whatever you want: the query will be passed unchanged to your `data` query resolver.

```
+++QUERY
query getData($projectId: Int!) {
  project(id: $projectId) {
    name
    details { year }
    people(sortedBy: "name") { name }
  }
}
+++
```

For the following sections (except where noted), we assume the following dataset:

```js
const data = {
  project: {
    name: 'docx-templates',
    details: { year: '2016' },
    people: [{ name: 'John', since: 2015 }, { name: 'Robert', since: 2010 }],
  },
};
```

### `EXEC` (`!`)

Executes a given JavaScript snippet, just like `INS` or `=`, but doesn't insert anything in the document. You can use `EXEC`, for example, to define functions or constants before using them elsewhere in your template.

```
+++EXEC
myFun = () => Math.random();
MY_CONSTANT = 3;
+++

+++! ANOTHER_CONSTANT = 5; +++
```

Usage elsewhere will then look like

```
+++= MY_CONSTANT +++
+++= ANOTHER_CONSTANT +++
+++= myFun() +++
```

**A note on scoping:**

When disabling sandbox mode (noSandbox: true), the scoping behaviour is slightly different. Disabling the sandbox will execute each EXEC snippet's code in a `with(this){...}` context, where this is the 'context' object. This 'context' object is re-used between the code snippets of your template. The critical difference outside of sandbox mode is that you are not declaring functions and variables in the global scope by default. The only way to assign to the global scope is to assign declarations as properties of the context object. This is simplified by the `with(context){}` wrapper: all global declarations are actually added as properties to this context object. Locally scoped declarations are not. _The above examples should work in both `noSandbox: true` and `noSandbox: false`.

This example declares the test function in the context object, making it callable from another snippet.
```js
test = () => {};
```

While the below example only declares test in the local scope of the snippet, meaning it gets garbage collected after the snippet has executed.
```js
function test() {};
```

### `IMAGE`

Includes an image with the data resulting from evaluating a JavaScript snippet:

```
+++IMAGE qrCode(project.url)+++
```

In this case, we use a function from `additionalJsContext` object passed to `createReport()` that looks like this:

```js
  additionalJsContext: {
    qrCode: url => {
      const dataUrl = createQrImage(url, { size: 500 });
      const data = dataUrl.slice('data:image/gif;base64,'.length);
      return { width: 6, height: 6, data, extension: '.gif' };
    },
  }
```

The JS snippet must return an _image object_ or a Promise of an _image object_, containing:

* `width`: desired width of the image on the page _in cm_. Note that the aspect ratio should match that of the input image to avoid stretching.
* `height` desired height of the image on the page _in cm_.
* `data`: either an ArrayBuffer or a base64 string with the image data
* `extension`: one of `'.png'`, `'.gif'`, `'.jpg'`, `'.jpeg'`, `'.svg'`.
* `thumbnail` _[optional]_: when injecting an SVG image, a fallback non-SVG (png/jpg/gif, etc.) image can be provided. This thumbnail is used when SVG images are not supported (e.g. older versions of Word) or when the document is previewed by e.g. Windows Explorer. See usage example below.
* `alt` _[optional]_: optional alt text.
* `rotation` _[optional]_: optional rotation in degrees, with positive angles moving clockwise.
* `caption` _[optional]_: optional caption displayed below the image

In the .docx template:
```
+++IMAGE injectSvg()+++
```

Note that you can center the image by centering the IMAGE command in the template.

In the `createReport` call:
```js
additionalJsContext: {
  injectSvg: () => {
      const svg_data = Buffer.from(`<svg  xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                                  <rect x="10" y="10" height="100" width="100" style="stroke:#ff0000; fill: #0000ff"/>
                                </svg>`, 'utf-8');

      // Providing a thumbnail is technically optional, as newer versions of Word will just ignore it.
      const thumbnail = {
        data: fs.readFileSync('sample.png'),
        extension: '.png',
      };
      return { width: 6, height: 6, data: svg_data, extension: '.svg', thumbnail };                    
    }
  }
```

### `LINK`

Includes a hyperlink with the data resulting from evaluating a JavaScript snippet:

```
+++LINK ({ url: project.url, label: project.name })+++
```

If the `label` is not specified, the URL is used as a label.

### `HTML`

Takes the HTML resulting from evaluating a JavaScript snippet and converts it to Word contents.

**Important:** This uses [altchunk](https://blogs.msdn.microsoft.com/ericwhite/2008/10/26/how-to-use-altchunk-for-document-assembly/), which is only supported in Microsoft Word, and not in e.g. LibreOffice or Google Docs.

```
+++HTML `
<meta charset="UTF-8">
<body>
  <h1>${$film.title}</h1>
  <h3>${$film.releaseDate.slice(0, 4)}</h3>
  <p>
    <strong style="color: red;">This paragraph should be red and strong</strong>
  </p>
</body>
`+++
```

### `FOR` and `END-FOR`

Loop over a group of elements (resulting from the evaluation of a JavaScript expression):

```
+++FOR person IN project.people+++
+++INS $person.name+++ (since +++INS $person.since+++)
+++END-FOR person+++
```

Note that inside the loop, the variable relative to the current element being processed must be prefixed with `$`.

It is possible to get the current element index of the inner-most loop with the variable `$idx`, starting from `0`. For example:
```
+++FOR company IN companies+++
Company (+++$idx+++): +++INS $company.name+++
Executives:
+++FOR executive IN $company.executives+++
-	+++$idx+++ +++$executive+++
+++END-FOR executive+++
+++END-FOR company+++
```

Since JavaScript expressions are supported, you can for example filter the loop domain:

```
+++FOR person IN project.people.filter(person => person.since > 2013)+++
...
```

`FOR` loops also work over table rows:

```
----------------------------------------------------------
| Name                         | Since                   |
----------------------------------------------------------
| +++FOR person IN             |                         |
| project.people+++            |                         |
----------------------------------------------------------
| +++INS $person.name+++       | +++INS $person.since+++ |
----------------------------------------------------------
| +++END-FOR person+++         |                         |
----------------------------------------------------------
```

And let you dynamically generate columns:

```
+-------------------------------+--------------------+------------------------+
| +++ FOR row IN rows+++        |                    |                        |
+===============================+====================+========================+
| +++ FOR column IN columns +++ | +++INS $row+++     | +++ END-FOR column +++ |
|                               |                    |                        |
|                               | Some cell content  |                        |
|                               |                    |                        |
|                               | +++INS $column+++  |                        |
+-------------------------------+--------------------+------------------------+
| +++ END-FOR row+++            |                    |                        |
+-------------------------------+--------------------+------------------------+
```

Finally, you can nest loops (this example assumes a different data set):

```
+++FOR company IN companies+++
+++INS $company.name+++
+++FOR person IN $company.people+++
* +++INS $person.firstName+++
+++FOR project IN $person.projects+++
    - +++INS $project.name+++
+++END-FOR project+++
+++END-FOR person+++

+++END-FOR company+++
```

### `IF` and `END-IF`

Include contents conditionally (depending on the evaluation of a JavaScript expression):

```
+++IF person.name === 'Guillermo'+++
+++= person.fullName +++
+++END-IF+++
```

Similarly to the `FOR` command, it also works over table rows. You can also nest `IF` commands
and mix & match `IF` and `FOR` commands. In fact, for the technically inclined: the `IF` command
is implemented as a `FOR` command with 1 or 0 iterations, depending on the expression value.

### `ALIAS` (and alias resolution with `*`)

Define a name for a complete command (especially useful for formatting tables):

```
+++ALIAS name INS $person.name+++
+++ALIAS since INS $person.since+++

----------------------------------------------------------
| Name                         | Since                   |
----------------------------------------------------------
| +++FOR person IN             |                         |
| project.people+++            |                         |
----------------------------------------------------------
| +++*name+++                  | +++*since+++            |
----------------------------------------------------------
| +++END-FOR person+++         |                         |
----------------------------------------------------------
```

## Inserting literal XML
You can also directly insert Office Open XML markup into the document using the `literalXmlDelimiter`, which is by default set to `||`.

E.g. if you have a template like this:

```
+++INS text+++
```

```js
await createReport({
  template,
  data: { text: 'foo||<w:br/>||bar' },
}
```

See http://officeopenxml.com/anatomyofOOXML.php for a good reference of the internal XML structure of a docx file.

# Error handling

By default, the Promise returned by `createReport` will reject with an error immediately when a problem is encountered in the template, such as a bad command (i.e. it 'fails fast'). In some cases, however, you may want to collect all errors that may exist in the template before failing. For example, this is useful when you are letting your users create templates interactively. You can disable fast-failing by providing the `failFast: false` parameter as shown below. This will make `createReport` reject with an array of errors instead of a single error so you can get a more complete picture of what is wrong with the template.

```typescript
try {
  const report = await createReport({
    template,
    data: {
      name: 'John',
      surname: 'Appleseed',
    },
    failFast: false,
  });
} catch (errors) {
  if (Array.isArray(errors)) {
    // An array of errors likely caused by bad commands in the template.
    console.log(errors);
  } else {
    // Not an array of template errors, indicating something more serious.
    throw errors;
  }
}
```
## Error types
The library exposes the following error types. See the `errors.ts` module for details.

```
NullishCommandResultError // thrown when rejectNullish is set to true and a command returns null or undefined
ObjectCommandResultError // thrown when the result of an `INS` command is an Object. This ensures you don't accidentally put `'[object Object]'` in your report.
CommandSyntaxError
InvalidCommandError
CommandExecutionError
ImageError
InternalError
TemplateParseError
IncompleteConditionalStatementError // thrown when an IF-statement has no corresponding END-IF command
```

## Custom error handler
A custom error handler callback can be provided to handle any errors that may occur when executing commands from a template. The value returned by this callback will be inserted into the rendered document instead. The callback is provided with two arguments: the error that was caught and the raw code of the command.

```typescript
  const report = await createReport({
    template,
    data: {
      name: 'John',
      surname: 'Appleseed',
    },
    errorHandler: (err, command_code) => {
      return 'command failed!';
    },
  });
```

Using a custom `errorHandler` in combination with `rejectNullish = true` allows users to intelligently replace the result of commands that returned `null` or `undefined` (make sure to check for `NullishCommandResultError`).

# Inspecting templates
The `listCommands` function lets you list all the commands in a docx template using the same parser as `createReport`.

```typescript
import { listCommands } from 'docx-templates';
const template_buffer = fs.readFileSync('template.docx');
const commands = await listCommands(template_buffer, ['{', '}']);

// `commands` will contain something like:
[
  { raw: 'INS some_variable', code: 'some_variable', type: 'INS' },
  { raw: 'IMAGE svgImgFile()', code: 'svgImgFile()', type: 'IMAGE' },
]
```

The `getMetadata` function lets you extract the metadata fields from a document, such as the number of pages or words. Note that this feature has a few limitations:
- Not all fields may be available, depending on the document. 
- These metadata fields, including the number of pages, are only updated by MS Word (or LibreOffice) when saving the document. Docx-templates does not alter these metadata fields, so the number of pages may not reflect the actual size of your rendered document (see issue [#240](https://github.com/guigrpa/docx-templates/issues/240)). Docx-templates can not reliably determine the number of pages in a document, as this requires a full-fledged docx renderer (e.g. MS Word).

```typescript
    import { getMetadata } from 'docx-templates';
    const template = fs.readFileSync('template.docx');
    await getMetadata(template)
    // result:
      Object {
        "category": undefined,
        "characters": 24,
        "company": undefined,
        "created": "2015-08-16T18:55:00Z",
        "creator": "Someone Else",
        "description": undefined,
        "lastModifiedBy": "Grau Panea, Guillermo",
        "lastPrinted": undefined,
        "lines": 1,
        "modified": "2016-12-15T11:21:00Z",
        "pages": 1,
        "paragraphs": 1,
        "revision": "32",
        "subject": undefined,
        "template": "Normal.dotm",
        "title": undefined,
        "words": 4,
      }
```

# Performance & security

**Templates can contain arbitrary javascript code. Beware of code injection risks!**

Obviously, this is less of an issue when running docx-templates in a browser environment.

Regardless of whether you are using sandboxing or not (`noSandbox: true`), be aware that allowing users to upload arbitrary templates to be executed on your server poses a significant security threat. Use at your own risk.

The library uses `require('vm')` as its default sandboxing environment. Note that this sandbox is explicitly [_not_ meant to be used as a security mechanism](https://nodejs.org/api/vm.html#vm_vm_executing_javascript). You can provide your own sandboxing environment if you want, as shown in [this example project](https://github.com/guigrpa/docx-templates/tree/master/examples/example-vm2).

Note that turning off the sandbox (`noSandbox: true`) is known to give significant performance improvements when working with large templates or datasets. However, before you do this, make sure you are aware of the security implications.

# Similar projects

* [docxtemplater](https://github.com/open-xml-templating/docxtemplater) (believe it or not, I just discovered this very similarly-named project after brushing up my old CS code for `docx-templates` and publishing it for the first time!). It provides lots of goodies, but doesn't allow (AFAIK) embedding queries or JS snippets.

* [docx](https://github.com/dolanmiu/docx) and similar ones - generate docx files from scratch, programmatically. Drawbacks of this approach: they typically do not support all Word features, and producing a complex document can be challenging.


# License (MIT)

This Project is licensed under the MIT License. See [LICENSE](LICENSE) for more information.
