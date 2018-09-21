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
