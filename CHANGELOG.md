## 4.13.0 (2024-04-17)
- [MR 360](https://github.com/guigrpa/docx-templates/pull/360) Added `maximumWalkingDepth` option for supporting large documents.
- Updated dependencies.

## 4.12.0 (2024-04-01)
- [#15](https://github.com/guigrpa/docx-templates/issues/15) Generate columns for a table using `FOR` loop.

## 4.11.5 (2024-03-24)
- [#340](https://github.com/guigrpa/docx-templates/issues/340) Fix for infinite loop bug: don't allow nested IFs on same `w:p` or `w:tr` tag.
- [#356](https://github.com/guigrpa/docx-templates/issues/356) Simplify documentation of INS commands.
- [#355](https://github.com/guigrpa/docx-templates/issues/355) Retain original sandbox errors (from different JavaScript realms) without coercion.

## 4.11.4 (2024-01-12)
- Replace weak `Object` types of `runJs` arguments.
- Remove unnecessary use of `eval()` internally.
- [#341](https://github.com/guigrpa/docx-templates/issues/341) Add result to `ObjectCommandResultError`. When a `ObjectCommandResultError` is thrown, this change attaches the computed result to the error in case a custom error handler wants to use it for some reason. (thanks @emilong!)
- [#345](https://github.com/guigrpa/docx-templates/issues/345): Make types for template more liberal. What works with Buffer should work with ArrayBuffer, with the benefit that browsers don't need a `Buffer` polyfill.

## 4.11.3 (2023-08-08)
-  ([PR #321](https://github.com/guigrpa/docx-templates/pull/321)) Fix `InvalidCommandError` referring to `'Unexpected END-IF outside of IF statement context:'` when the problem was actually an unexpected `END-FOR`. Thanks @davidjb
- Issue [#322](https://github.com/guigrpa/docx-templates/issues/322): Fix silent failure caused by unterminated for-loop in template, leading to a (partially) empty report. Throw new `UnterminatedForLoopError` when `FOR` loop is not properly terminated with an `END-FOR`.
- Remove unnecessary runtime dependency (`timm`).
- Upgrade `jszip` dependency to latest version.

## 4.11.2 (2023-07-14)
- Issue [#296](https://github.com/guigrpa/docx-templates/issues/296): Fix bug caused by Shapes having the same ID they are generated from a FOR loop. ([PR #315](https://github.com/guigrpa/docx-templates/pull/315)) Thanks @SuchiraD!
- Issue [#314](https://github.com/guigrpa/docx-templates/issues/314): Ensure all custom error types are exported.

## 4.11.1 (2023-04-04)
-  ([PR #305](https://github.com/guigrpa/docx-templates/pull/305)) the `IncompleteConditionalStatementError` is now thrown when an 'IF' statement lacks a corresponding 'END-IF' command. Thanks @RoXuS !

## 4.11.0 (2023-03-02)
- [Issue #143](https://github.com/guigrpa/docx-templates/issues/143): Add optional `processLineBreaksAsNewText` toggle which provides an alternative way of inserting line breaks from commands into the docx XML. This should improve rendering of newlines in a few docx readers, like LibreOffice. ([PR #182](https://github.com/guigrpa/docx-templates/pull/182)). Thanks @khaled-iva-docs !
- Updated dependencies.

## 4.10.0 (2023-02-03)
- [Issue #194](https://github.com/guigrpa/docx-templates/issues/194): add ability to provide captions for images ([PR #286](https://github.com/guigrpa/docx-templates/pull/286)).
- Ensure XMLs are processed in a deterministic order (mainly relevant for `listCommands()`), see commit 8b2ba5526df78da675eaf59f88cb76035ffac5bd.
- Various minor code quality and typing improvements.
- Bumped dependencies.

## 4.9.2 (2022-04-04)
- [PR 266](https://github.com/guigrpa/docx-templates/pull/266) Fix types for Deno bundle (by @mathe42).

## 4.9.1 (2022-02-18)
- [Issue #259](https://github.com/guigrpa/docx-templates/issues/259) Fix issue that caused inserted images to be overwritten when `createReport()` was invoked a second time on the resulting template.

## 4.9.0 (2022-01-20)
- Updated dependencies.
- [PR 253](https://github.com/guigrpa/docx-templates/pull/253) Add support for Deno through the browser bundle. Thanks @mathe42!

## 4.8.2 (2021-09-28)
- [PR 233](https://github.com/guigrpa/docx-templates/pull/233) Prevent adding empty paragraph if cell contains altChunk. Thanks @pkozul!

## 4.8.1 (2021-09-28)
- [#239](https://github.com/guigrpa/docx-templates/issues/239) Fixed issue that prevented the `listCommands` function from detecting commands in the template's header and footer.

## 4.8.0 (2021-08-06)
- [#231](https://github.com/guigrpa/docx-templates/issues/231) The library now also comes with a pre-compiled and polyfilled browser build. See [documentation](https://github.com/guigrpa/docx-templates#polyfilled-browser-ready-bundle) in README. Thanks @mathe42!
- [PR 229](https://github.com/guigrpa/docx-templates/pull/229) Minor change to how filenames of HTML snippets are formatted in the final .docx file so the resulting documents work with picky parsers.

## 4.7.0 (2021-07-12)
* [#221](https://github.com/guigrpa/docx-templates/issues/221) New feature: user can now optionally specify image rotation when using IMAGE commands.
* [#218](https://github.com/guigrpa/docx-templates/issues/218) Fixed bug that caused redundant copies of images to be inserted into the docx file.
* [#133](https://github.com/guigrpa/docx-templates/issues/133) Fix for the INTERNAL ERROR thrown when using links inside for loops.
* [#222](https://github.com/guigrpa/docx-templates/issues/222) Fix for bug that caused HTML commands to produce corrupted docx files.

## 4.6.4 (2021-07-02)
* Fixed bug that caused IMAGE commands in the document body to be ignored when a shape or image was already present in the document's header or footer. ([#217](https://github.com/guigrpa/docx-templates/issues/217)).

## 4.6.3 (2021-06-05)
* Allow arrays as the result of INS commands again ([#214](https://github.com/guigrpa/docx-templates/issues/214)). Thanks @LexAckson for pointing this out.

## 4.6.2 (2021-06-03)
* Fix for issues [#190](https://github.com/guigrpa/docx-templates/issues/190) and [#144](https://github.com/guigrpa/docx-templates/issues/144). Image IDs in the rendered XML are now ensured to be globally unique to avoid warnings of file corruption in some popular editors (like MS Word).

## 4.6.1 (2021-06-01)
* Fix for issue [#213](https://github.com/guigrpa/docx-templates/issues/213): throw an error when user tries to iterate over a non-array in a template with a FOR loop. This used to create an infinite loop.
* Throw `ObjectCommandResultError` when the result of an `INS` command is an Object. This ensures you don't accidentally put `'[object Object]'` in your report.

## 4.6.0 (2021-03-27)
* Add support for `.docm` (macro-enabled) templates (issue [#195](https://github.com/guigrpa/docx-templates/issues/195)). Thanks @brockfanning!

## 4.5.4 (2021-03-05)
* Improve error messages.
* Export error types at the library level.
* Update dependencies.

## 4.5.3 (2020-12-18)
* Correctly export `getMetadata` function from library index module / entrypoint.

## 4.5.2 (2020-11-13)
* Corrected check for valid image data. ArrayBuffers are now also valid image data containers, as the type definitions suggest (issue [#166](https://github.com/guigrpa/docx-templates/issues/166)).

## 4.5.1 (2020-10-24)
* Enhancement: extensive validation of `IMAGE` command parameters before execution to prevent silent failures caused by user error, particularly in plain javascript and untyped settings. Related to issue [#158](https://github.com/guigrpa/docx-templates/issues/158).

## 4.5.0 (2020-09-16)
* Feature: added `fixSmartQuotes` flag (see [PR #152](https://github.com/guigrpa/docx-templates/pull/152)). Thanks @speedpro! MS Word usually autocorrects JS string literal quotes with unicode 'smart' quotes ('curly' quotes). E.g. 'aubergine' -> ‘aubergine’. This causes an error when evaluating commands containing these smart quotes, as they are not valid JavaScript. If you set `fixSmartQuotes` to 'true', these smart quotes will automatically get replaced with straight quotes (') before command evaluation. Defaults to false.

## 4.4.0 (2020-08-19)
* Feature: added `getMetadata` function to extract the metadata fields from a document, such as the number of pages or words (see [issue #94](https://github.com/guigrpa/docx-templates/issues/94)).
* Feature: user can now provide a custom `errorHandler` callback to handle any errors that may occur when executing commands from a template. The value returned by this callback will be inserted into the rendered document instead (see [issue #138](https://github.com/guigrpa/docx-templates/issues/138)).
* Restructured `CommandExecutionError` to make it contain the full Error original object that caused it to be thrown.

## 4.3.0 (2020-06-23)
* Feature: added `listCommands` function to find and list all commands in a document (see [issue #90](https://github.com/guigrpa/docx-templates/issues/90)).
* Minor refactoring.
* Updated jszip dependency.

## 4.2.0 (2020-06-15)
* Feature: added 'rejectNullish' setting. When set to `true`, this setting ensures `createReport` throws a `NullishCommandResultError` when the result of an INS, HTML, IMAGE, or LINK command is `null` or `undefined`. This is useful as nullish return values usually indicate a mistake in the template or the invoking code. Defaults to `false`.
* Enhancement: typed Errors to facilitate more fine-grained downstream error handling.

## 4.1.1 (2020-06-06)
* [PR #121](https://github.com/guigrpa/docx-templates/pull/121) Improved detection of built-in commands in templates to avoid confusion with javascript symbols.
* [#107](https://github.com/guigrpa/docx-templates/issues/107) Library now correctly recognizes user-defined commands with non-alphanumeric names (like Chinese characters).
* [#131](https://github.com/guigrpa/docx-templates/issues/131): .docx template files originating from Office365 or SharePoint can now be used (PR [#132](https://github.com/guigrpa/docx-templates/pull/121))

## 4.1.0 (2020-4-25)

* #112 Failing on the first error that is encountered while rendering a template is now optional behaviour (but still the default). Use `failFast: false` to collect all errors in a template before failing. This allows for less cumbersome interactive correction of typos or other mistakes in template commands.
* #33 SVGs can now be inserted into the templates directly, based on excellent work by @lwallent.
* #113 fixed a regression caused by relying on incomplete jsZip type definitions.
* #83 fixed a bug that occurred when links were used in FOR loops.
* Added docstrings (thanks @mathe42 !)

## 4.0.0 (2020-04-13)

* Removed Flow and switched entire codebase over to TypeScript. In the process a few minor soundness issues were fixed.

* **Breaking change** Removed dependency on Node filesystem APIs so the library no longer needs a separate node and browser entrypoint, simplifying maintenance and development. This has the following implications for the public API, justifying the version bump to 4.0.0:
  *  You can no longer provide image data as a path, and need to provide an `ArrayBuffer` or base64-encoded string instead.

  *  You can no longer provide a template as a filesystem path, and you'll need to read it into a Buffer first.

  * Removed `output: 'buffer'` argument. The output of `createReport` is now always a `Uint8Array`, unless the debug argument `_probe` is specified.
  

The README and examples have also been updated to reflect the above changes.


## 3.1.1 (2019-8-20)

* Avoid issue when a single paragraph contains `END-IF/FOR` for a previous loop and `IF/FOR` for a new one (#72).
* Fix hyperlink styles (#64).

## 3.1.0 (2019-8-20)

* Allow different left/right command delimiters, e.g. `cmdDelimiter: ['{', '}']` (#66, #70).
* Allow omission of the `INS` (or `=`) command (#70).

## 3.0.0 (2019-2-17)

* **Breaking change**: removed `replaceImages`, `replaceImagesBase64` options (deprecated since v2.4.0). Please use the `IMAGE` command instead.
* **Breaking change for users of the `vm2` sandbox**: replaced `vm2Sandbox` option (which caused headaches for users in the browser) with `runJs`, a custom hook for JS snippet execution. If you want to use vm2:

```js
import createReport from 'docx-templates';
import { VM, VMScript } from 'vm2';

createReport({
  template: /* ... */,
  data: /* ... */,
  runJs: ({ sandbox }) => {
    const script = new VMScript(
      `
      __result__ = eval(__code__);
      `
    ).compile();
    const vm2 = new VM({ sandbox });
    vm2.run(script);
    const { VMError, Buffer, ...modifiedSandbox } = vm2._context;
    const result = modifiedSandbox.__result__;
    return { modifiedSandbox, result };
  }
})
```

## 2.10.0 (2019-2-16)

* Let alternate text be specified for images (@emilong, #57).

## 2.9.1 (2019-1-3)

## 2.9.0 (2018-11-30)

## 2.9.0-rc.1 (2018-11-22)

## 2.9.0-rc.0 (2018-11-19)

* Fix race condition in which a file was generated and was later used by another section of the processor (added cache in zip module) (should solve #44).

## 2.8.0 (2018-11-19)

* Accept Buffer in `template` and `'buffer'` in `output`.

## 2.7.3 (2018-10-19)

* Support `null` as output from a JS snippet in Word (#39).

## 2.7.2 (2018-9-21)

## 2.7.1 (2018-9-20)

* `IMAGE`: add BMP support (#34).

## 2.7.0 (2018-9-20)

* Add `HTML` command (!!!) (@vdechef, #32).
* Fix browser examples by shimming `vm2` (@vdechef, #35).

## 2.6.0 (2018-7-16)

* Add `LINK` command (!!!) (#20).

## 2.5.2 (2018-7-15)

* Bugfix: fix multiline query extraction (#21).
* Bugfix: correctly escape output attributes to avoid issues like #24 (watermask).

## 2.5.1 (2018-7-15)

* Bugfix: avoid messing up of images inserted in the document body with those inserted in the header (#25).

## 2.5.0 (2018-7-14)

* Add `vm2Sandbox` option for higher security in JS execution (@nheisterkamp, #26).

## 2.4.1 (2018-5-5)

* Support `IMAGE` command in headers, footers, etc. (#19).

## 2.4.0 (2018-2-7)

* Add `IMAGE` command (!!!).
* Made it a monorepo: main package + examples.
* **Deprecates** `replaceImages` and `replaceImagesBase64` options (please use the `IMAGE` command).

## 2.3.2 (2018-1-29)

* Compress generated reports to reduce size (@vdechef, #13).

## 2.3.1 (2018-1-19)

* Add **browser support** (@vdechef, #10)
* Add `IF`/`END-IF`

## 2.2.2 (Jul. 14, 2017)

* Bugfix: Remove `babel-polyfill` dependency, replace by the lightweight `babel-runtime` + `babel-plugin-transform-runtime` (#7)

## 2.2.0, 2.2.1 (Jul. 11, 2017)

* Add `replaceImages` option (including base64 support via `replaceImagesBase64` option) [based on #5]

## 2.1.1 (Jan. 25, 2017)

* Fix a case in which the tool hangs indefinitely when a query is expected and not found.

## 2.1.0 (Jan. 24, 2017)

* [M] Add support for commands in headers, footers and elsewhere

## 2.0.0 (Jan. 6, 2017)

* **Breaking changes:**
  * `SHORTHAND` has been renamed `ALIAS`
  * Alias resolution syntax has changed: `+++[name]+++` is no longer supported; use `+++*name+++` instead (for coherence with other commands)
* **Non-breaking:**
  * [M] Add support for **JS code** in `INS`, `VAR` and `FOR`
  * [M] Add `EXEC` command (no output)
  * [M] Add shorthand notation: `=` for `INS`, `!` for `EXEC`, `*` shorthand for alias resolution
  * [M] Improve robustness:
    * Much more robust internal algorithm
    * Now allows command delimiters to be split across multiple `w:t` elements+
    * Better handling of spaces in commands
    * Better handling of spaces in text with interspersed commands
  * [M] Process **line breaks in input strings** correctly, producing `<w:br/>` tags (can be disabled)
  * [M] Allow insertion of **literal XML** (with configurable delimiter, `||` by default)
  * [m] Allow customisation of the command delimiter
  * [M] Allow **loops in a single paragraph**
  * [m] Remove archive.bulk() deprecation warning

## 1.0.1, 1.0.2 (Dec. 15, 2016)

* [M] Add docs

## 1.0.0 (Dec. 15, 2016)

* [M] First public release
