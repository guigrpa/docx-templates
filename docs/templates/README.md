# Docx-templates [![Build Status](https://travis-ci.org/guigrpa/docx-templates.svg)](https://travis-ci.org/guigrpa/docx-templates) [![Coverage Status](https://coveralls.io/repos/github/guigrpa/docx-templates/badge.svg?branch=master)](https://coveralls.io/github/guigrpa/docx-templates?branch=master) [![npm version](https://img.shields.io/npm/v/docx-templates.svg)](https://www.npmjs.com/package/docx-templates)

Template-based docx report creation.

## Why?

* **Write reports naturally using Word**, just adding some commands where needed for dynamic contents
* **Express your data needs (queries) in the template itself**, in whatever query language you want (e.g. in GraphQL). This is similar to *the Relay way™*: in [Relay](https://facebook.github.io/relay/), data requirements are declared alongside the React components that need the data
* Use a small **template language**: `FOR`/`END-FOR` (with support for table rows), `INS`, `ALIAS` (alias), `QUERY`, `VAR`
* **Transparent JavaScript support** (`FOR`, `INS` and `VAR`), running in a separate Node VM for security
* **Nested** loops
* Custom **variables** and **shorthand** commands (useful for writing table templates)
* Inclusion of **literal XML**

Docx-templates relies on the .docx format, which is really complex, so **use with caution**, at least for now. Feel free to submit issues or (even better!) PRs.

If you need external plugins or other bells and whistles please also check out [docxtemplater](https://github.com/open-xml-templating/docxtemplater).

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

Here is a (contrived) example, with report data injected directly as an object:

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

This will create a report based on the input data at the specified path. Some notes:

* All paths are relative to `process.cwd()`
* If the output location is omitted, a report will be generated in the same folder as the template

You can also **provide a sync or Promise-returning callback function (query resolver)** instead of an object `data`:

```js
createReport({
  template: 'templates/myTemplate.docx',
  output: 'reports/myReport.docx',
  data: (query) => graphqlServer.execute(query),
});
```

Your resolver callback will receive the query embedded in the template (in a `QUERY` command) as an argument.

Other options (with defaults):

```js
createReport({
  // ...
  cmdDelimiter: '+++',
  literalXmlDelimiter: '||',
  processLineBreaks: true,
});
```

### Writing templates

You can find several template examples in this repo:

* [SWAPI](https://github.com/guigrpa/docx-templates/tree/master/examples/swapi), a good example of what you can achieve embedding a template (GraphQL in this case) in your report, including a simple script for report generation. Uses the freak-ish online [Star Wars GraphQL API](https://github.com/graphql/swapi-graphql)
* [Several templates](https://github.com/guigrpa/docx-templates/tree/master/examples/sampleTemplates)
* [More specific templates, used for tests]( https://github.com/guigrpa/docx-templates/tree/master/src/__tests__/fixtures)

Here is the list of currently supported commands:

#### QUERY

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
    people: [
      { name: 'John', since: 2015 },
      { name: 'Robert', since: 2010 },
    ]
  },
};
```

#### VAR

Declare a custom variable (or an *alias*) for a given (JavaScript) expression:

```
+++VAR details project.details+++
+++VAR uppercaseName project.name.toUpperCase()+++
```

#### INS

Insert the result of a given (JavaScript) expression:

```
+++INS project.name+++ (+++INS project.details.year+++)
+++VAR details project.details+++
+++INS project.name+++ (+++INS $details.year+++)
+++INS `${project.name} (${$details.year})`+++
```

Use JavaScript's ternary operator to implement an *if-else* structure:

```
+++INS $details.year != null ? `(${$details.year})` : ''+++
```

#### FOR and END-FOR

Loop over a group of elements (resulting from the evaluation of a JavaScript expression):

```
+++FOR person IN project.people+++
+++INS $person.name+++ (since +++INS $person.since+++)
+++END-FOR person+++
```

Since JavaScript expressions are supported, you can for example filter the loop domain:

```
+++FOR person IN project.people.filter(person => person.since > 2013)+++
...
```

FOR loops also work over table rows:

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

#### ALIAS

Define an alias for a complete command (especially useful for formatting tables):

```
+++ALIAS name INS $person.name+++
+++ALIAS since INS $person.since+++

----------------------------------------------------------
| Name                         | Since                   |
----------------------------------------------------------
| +++FOR person IN             |                         |
| project.people+++            |                         |
----------------------------------------------------------
| +++[name]+++                 | +++[since]+++           |
----------------------------------------------------------
| +++END-FOR person+++         |                         |
----------------------------------------------------------
```


## [Changelog](https://github.com/guigrpa/docx-templates/blob/master/CHANGELOG.md)

## Similar projects

* [docxtemplater](https://github.com/open-xml-templating/docxtemplater) (believe it or not, I just discovered this very similarly-named project after brushing up my old CS code for `docx-templates` and publishing it for the first time!). It provides lots of goodies, but doesn't allow (AFAIK) embedding queries or JS snippets.

* [docx](https://github.com/dolanmiu/docx) and similar ones - generate docx files from scratch, programmatically. Drawbacks of this approach: they typically do not support all Word features, and producing a complex document can be challenging.

## License (MIT)

Copyright (c) [Guillermo Grau Panea](https://github.com/guigrpa) 2016

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
