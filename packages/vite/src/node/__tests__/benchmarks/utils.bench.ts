import { bench, describe } from 'vitest'
import { cleanUrl } from '../../../shared/utils'
import {
  combineSourcemaps,
  emptyCssComments,
  generateCodeFrame,
  injectQuery,
  isCSSRequest,
  isJSRequest,
  mergeConfig,
  normalizePath,
  processSrcSetSync,
  removeTimestampQuery,
} from '../../utils'

const ids = Array.from({ length: 200 }, (_, i) => [
  `/src/components/Component${i}.vue?vue&type=style&index=0&lang.css`,
  `C:\\project\\src\\pages\\page${i}.tsx`,
  `/node_modules/.vite/deps/dep${i}.js?v=1234abcd&t=1700000000000`,
  `/src/styles/theme${i}.module.scss?direct`,
  `/assets/image${i}.png?url`,
]).flat()

describe('url and path helpers', () => {
  bench('normalizePath', () => {
    for (const id of ids) normalizePath(id)
  })

  bench('cleanUrl + removeTimestampQuery', () => {
    for (const id of ids) cleanUrl(removeTimestampQuery(id))
  })

  bench('injectQuery', () => {
    for (const id of ids) injectQuery(id, 'import')
  })

  bench('isJSRequest + isCSSRequest', () => {
    for (const id of ids) {
      isJSRequest(id)
      isCSSRequest(id)
    }
  })
})

const largeSource = Array.from(
  { length: 2000 },
  (_, i) => `const value${i} = compute(${i}, 'some string literal ${i}');`,
).join('\n')

describe('generateCodeFrame', () => {
  bench('middle of a large file', () => {
    generateCodeFrame(largeSource, { line: 1000, column: 10 })
  })
})

const srcset = Array.from(
  { length: 50 },
  (_, i) => `/images/photo-${i}.jpg ${(i + 1) * 100}w`,
).join(', ')

describe('processSrcSetSync', () => {
  bench('50 candidates', () => {
    processSrcSetSync(srcset, ({ url }) => `/base${url}`)
  })
})

const cssWithComments = Array.from(
  { length: 500 },
  (_, i) =>
    `/* comment ${i} with some text */\n.class-${i} { color: red; /* inline */ background: url("./img${i}.png"); }`,
).join('\n')

describe('emptyCssComments', () => {
  bench('500 rules', () => {
    emptyCssComments(cssWithComments)
  })
})

const baseConfig = {
  root: '/project',
  base: '/',
  plugins: [{ name: 'a' }, { name: 'b' }],
  resolve: {
    alias: [{ find: '@', replacement: '/project/src' }],
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  server: { port: 3000, host: 'localhost', fs: { allow: ['..'] } },
  build: {
    outDir: 'dist',
    rollupOptions: { external: ['vue', 'react'], output: { format: 'es' } },
  },
  define: Object.fromEntries(
    Array.from({ length: 50 }, (_, i) => [`__FLAG_${i}__`, `"${i}"`]),
  ),
}
const overrideConfig = {
  plugins: [{ name: 'c' }],
  resolve: {
    alias: { '~': '/project/node_modules' },
    dedupe: ['vue'],
  },
  server: { port: 4000, proxy: { '/api': 'http://localhost:8080' } },
  build: { sourcemap: true, rollupOptions: { external: ['lodash'] } },
  define: Object.fromEntries(
    Array.from({ length: 50 }, (_, i) => [`__OTHER_${i}__`, `"${i}"`]),
  ),
}

describe('mergeConfig', () => {
  bench('nested user config', () => {
    mergeConfig(baseConfig, overrideConfig)
  })
})

const sourcemaps = [
  {
    version: 3,
    file: 'foo.js',
    sources: ['foo.ts'],
    names: [],
    mappings:
      'AAAA,SAAS,GAAG,CAAC,CAAS;IACnB,OAAO,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC;AACzB,CAAC;AAED,GAAG,CAAC,CAAC,CAAC,CAAC',
    sourcesContent: ['function foo(a: number) {\n  return a + a\n}\nfoo(1)\n'],
  },
  {
    version: 3,
    file: 'foo.js',
    sources: ['foo.js'],
    names: [],
    mappings: 'AAAA;AACA;AACA;AACA',
    sourcesContent: ['function foo(a) {\n  return a + a;\n}\nfoo(1);\n'],
  },
]

describe('combineSourcemaps', () => {
  bench('two-step chain', () => {
    combineSourcemaps('foo.ts', sourcemaps as any)
  })
})
