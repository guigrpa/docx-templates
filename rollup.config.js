/* eslint-disable */
import replace from '@rollup/plugin-replace'
import esbuild from 'rollup-plugin-esbuild'
import node from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

function defineConfig(inFile, outFile, target, isNode, format) {
  return {
    input: './src/' + inFile,
    output: { file: './lib/' + outFile, format, exports: 'named', sourcemap: true },
    external: isNode ? ['jszip', 'timm', 'sax', 'vm'] : [],
    plugins: [
      isNode ? null : node({
        preferBuiltins: false
      }),
      isNode ? null : commonjs(),
      isNode ? null : replace({
        values: {
          'process.env.NODE_DEBUG': false,
          'process.pid': 42,
          'process.nextTick': 'setTimeout',
          'process.stdout': 'null',
          'process.stderr': 'null',
          'process.env.READABLE_STREAM': 'false',
          'process.browser': 'true',
          'process.env.NODE_ENV': '"production"',
          'process': 'undefined'
        }
      }),
      esbuild({
        target: target,
        minify: true
      }),
      isNode ? null : {
        name: 'module-map',
        resolveId(id) {
          if (id === 'vm') {
            return this.resolve('vm-browserify')
          }
          if (id === 'stream') {
            return this.resolve('stream-browserify')
          }
        }
      }
    ]
  }
}

export default [
  defineConfig('browser.ts', 'browser.js', 'es2017', false, 'es'),
  defineConfig('index.ts', 'index.js', 'es6', true, 'cjs'),
  defineConfig('index.ts', 'index.es.mjs', 'es6', true, 'es'),
]
