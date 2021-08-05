import replace from '@rollup/plugin-replace'
import esbuild from 'rollup-plugin-esbuild'
import node from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'


export default {
  input: './src/browser.ts',
  output: { file: './lib/browser.js', format: 'es', exports: 'named', sourcemap: true },
  plugins: [
    node({
      preferBuiltins: false
    }),
    commonjs(),
    // Set some node specific globals
    replace({
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
      target: 'es2017',
      minify: true
    }),
    // Map modules to polyfill
    {
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