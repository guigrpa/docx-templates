# Docx-templates [![Build Status](https://travis-ci.org/guigrpa/docx-templates.svg)](https://travis-ci.org/guigrpa/docx-templates) [![Coverage Status](https://coveralls.io/repos/github/guigrpa/docx-templates/badge.svg?branch=master)](https://coveralls.io/github/guigrpa/docx-templates?branch=master) [![npm version](https://img.shields.io/npm/v/docx-templates.svg)](https://www.npmjs.com/package/docx-templates)

Template-based docx report creation.

## Why?

* **Write reports naturally using Word**, just adding commands where needed for dynamic contents
* **Embed your queries in the template itself**, e.g. in GraphQL, following *the Relay way* (in [Relay](https://facebook.github.io/relay/), you declare your data needs alongside the React components that use them)
* A small **custom language**, with commands such as `FOR` (+ `END-FOR`), `FOR-ROW` (+ `END-FOR-ROW`), `INS`, `SHORTHAND`, `QUERY`
* Can embed a data query directly in the document, which will be passed to a callback provided by the user
* **Nested** loops
* Custom **variables** and **shorthand** commands (useful for writing table templates)

Docx-templates will probably not support all use cases, so **use with caution**. If you need more extensibility, a more mature project, and more bells and whistles please also check out [docxtemplater](https://github.com/open-xml-templating/docxtemplater).

## Installation

```
$ npm install docx-templates
```

...or using yarn:

```
$ yarn add docx-templates
```

## Usage

### API

Here is a contrived example, injecting data directly as an object:

```js
import createReport from 'docx-templates';

createReport({
  template: 'templates/myTemplate.docx',
  output: 'reports/myReport.docx',
  data: {
    name: 'John',
    surname: 'Appleseed',
  },
});
```

This will create a report at the specified location (*all paths are relative to `process.cwd()`*) using the injected data. Some notes:

* All paths are relative to `process.cwd()`
* If the output location is omitted, a report will be generated in the same folder as the template

You can also **provide a (sync or async) query resolver** instead of an object `data`. See this example:

```js
createReport({
  template: 'templates/myTemplate.docx',
  output: 'reports/myReport.docx',
  data: (query) => graphqlServer.execute(query),
});
```

Your resolver callback will receive the query embedded in the template (in a `QUERY` command) as an argument.

### Writing templates

You can find many examples under https://github.com/guigrpa/docx-templates/tree/master/src/__tests__/templates, many of which are used for tests. Here are a few examples and notes on command syntax:

#### QUERY

You can use GraphQL, SQL, whatever you like. As explained above, the query will be passed to your `data` query resolver.

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

For the following sections, we assume that our dataset is something like this:

```js
const data = {
  project: {
    name: 'docx-templates',
    details: { year: '2016' },
    people: [
      { name: 'John', since: '2015' },
      { name: 'Robert', since: '2010' },
    ]
  },
};
```

#### VAR

Declare a custom variable (or an *alias*) for a given datapath:

```
+++VAR details project.details+++
```

#### INS

Insert the value at a given datapath (the second example uses a previously declared variable):

```
+++INS project.name+++ (+++INS project.details.year+++)
+++INS project.name+++ (+++INS $details.year+++)
```

#### FOR (FOR-ROW) and END-FOR (END-FOR-ROW)

Loop over a group of elements:

```
+++FOR person IN project.people+++
+++INS $person.name+++ (since +++INS $person.since+++)
+++END-FOR person+++
```

Similarly, for table rows:

```
----------------------------------------------------------
| Name                         | Since                   |
----------------------------------------------------------
| +++FOR-ROW person IN         |                         |
| project.people+++            |                         |
----------------------------------------------------------
| +++INS $person.name+++       | +++INS $person.since+++ |
----------------------------------------------------------
| +++END-FOR-ROW person+++     |                         |
----------------------------------------------------------
```

You can nest loops (example uses a different data set):

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

#### SHORTHAND

Define an alias for a complete command (especially useful for formatting tables):

```
+++SHORTHAND name INS $person.name+++
+++SHORTHAND since INS $person.since+++

----------------------------------------------------------
| Name                         | Since                   |
----------------------------------------------------------
| +++FOR-ROW person IN         |                         |
| project.people+++            |                         |
----------------------------------------------------------
| +++[name]+++                 | +++[since]+++           |
----------------------------------------------------------
| +++END-FOR-ROW person+++     |                         |
----------------------------------------------------------
```


## [Changelog](https://github.com/guigrpa/docx-templates/blob/master/CHANGELOG.md)

## Similar projects

* [docxtemplater](https://github.com/open-xml-templating/docxtemplater) (just discovered it after brushing up my old CS code for `docx-templates`, publishing it for the first time and bumping into this very similarly named project).

* [docx](https://github.com/dolanmiu/docx) and similar ones - generate docx files from scratch, programmatically.

## License (MIT)

Copyright (c) [Guillermo Grau Panea](https://github.com/guigrpa) 2016

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
