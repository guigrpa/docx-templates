import replace from '@rollup/plugin-replace'
import esbuild from 'rollup-plugin-esbuild'
import node from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

/**
 * Creates a config from a few params.
 * 
 * @param {string} inFile Name of input file
 * @param {string} outFile Name of output file
 * @param {string} target Target es type for exampe es2017
 * @param {boolean} isNode Is Node env
 * @param {string} format Wich output format umd / es / cjs / amd
 * @returns 
 */
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
      // Set some node specific globals
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
      // Map modules to polyfill
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
  // Browser build.
  defineConfig('browser.ts', 'browser.js', 'es2017', false, 'es')
  // NodeJS build with require
  // defineConfig('index.ts', 'index.js', 'es6', true, 'cjs'),
  // NodeJS build with es module syntax wich is better for bundles
  // defineConfig('index.ts', 'index.es.mjs', 'es6', true, 'es'),
]
