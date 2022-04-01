import replace from '@rollup/plugin-replace'
import esbuild from 'rollup-plugin-esbuild'
import node from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import dts from 'rollup-plugin-dts'
import { defineConfig } from 'rollup'

export default defineConfig([{
  input: './src/browser.ts',
  output: { file: './lib/browser.js', format: 'es', exports: 'named', sourcemap: true },
  plugins: [
    node({
      preferBuiltins: false
    }),
    commonjs(),
    // Set some node specific globals
    replace({
      preventAssignment: true,
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
}, {
  input: './lib/index.d.ts',
  output: { file: './lib/bundled.d.ts', format: 'es' },
  plugins: [
    dts({ respectExternal: true }),
    {
      renderChunk(code) {
        return 'type Buffer = ArrayBufferLike;\n'+ code.split('\n').slice(1).join('\n')
      }
    }
  ],
  external: [
    // To prevent warning. If `import ... from 'stream'` exists in bundled.d.ts this build has to be changed to remove it.
    'stream'
  ]
}])
