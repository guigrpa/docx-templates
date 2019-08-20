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
