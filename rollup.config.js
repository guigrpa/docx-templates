/* eslint-disable */
import replace from '@rollup/plugin-replace'
import esbuild from 'rollup-plugin-esbuild'

function defineConfig(outFile, target, replacements, isNode, format) {
  return {
    input: './src/index.ts',
    output: { file: './lib/' + outFile, format },
    external: ['jszip', 'timm', 'sax'],
    plugins: [
      replace({
        values: replacements,
        preventAssignment: false
      }),
      esbuild({
        target: target,
        minify: true
      }),
      isNode ? null : {
        name: 'vm',
        resolveId(id) {
          if (id === 'vm') {
            return 'vm'
          }
        },
        load(id) {
          if (id === 'vm') {
            return 'export default null'
          }
        }
      }
    ]
  }
}

export default [
  defineConfig('browser.js', 'es2017', {
    __IS_BROWSER__: true
  }, false, 'es'),
  defineConfig('index.js', 'es6', {
    __IS_BROWSER__: false
  }, true, 'cjs'),
]
