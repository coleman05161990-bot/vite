import path from 'node:path'
import { bench, describe } from 'vitest'
import { hoistAtRules } from '../../plugins/css'
import {
  parseImportGlob,
  transformGlobImport,
} from '../../plugins/importMetaGlob'
import { traverseHtml } from '../../plugins/html'
import { transformWithOxc } from '../../plugins/oxc'

// small on-disk fixture so that glob resolution stays cheap and deterministic
const root = path.resolve(import.meta.dirname, '../plugins/importGlob')
const importer = path.join(root, 'fixture-a/index.ts')
const resolveId = (id: string) => id

const globCode = `
import { createApp } from 'vue'
const pages = import.meta.glob('./modules/*.ts')
const eagerModules = import.meta.glob(['./modules/*.ts', '!**/index.ts'], { eager: true })
const raw = import.meta.glob('./*.ts', { query: '?raw', import: 'default' })
const named = import.meta.glob('./modules/*.ts', { import: 'name', eager: true })
createApp({ pages, eagerModules, raw, named }).mount('#app')
`

describe('importMetaGlob', () => {
  bench('parseImportGlob', async () => {
    await parseImportGlob(globCode, importer, root, resolveId)
  })

  bench('transformGlobImport', async () => {
    await transformGlobImport(globCode, importer, root, resolveId)
  })
})

const css = Array.from(
  { length: 200 },
  (_, i) =>
    `.rule-${i} { color: red; }\n${
      i % 20 === 0 ? `@import "./partial-${i}.css";\n@charset "utf-8";\n` : ''
    }`,
).join('\n')

describe('css', () => {
  bench('hoistAtRules', async () => {
    await hoistAtRules(css)
  })
})

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite App</title>
    <link rel="stylesheet" href="/src/style.css" />
    <script type="importmap">{ "imports": { "vue": "/node_modules/vue/dist/vue.esm-browser.js" } }</script>
  </head>
  <body>
    <div id="app">
${Array.from(
  { length: 100 },
  (_, i) =>
    `      <section class="item-${i}"><img src="/img/${i}.png" srcset="/img/${i}.png 1x, /img/${i}@2x.png 2x" alt="${i}" /><a href="/page/${i}">Link ${i}</a></section>`,
).join('\n')}
    </div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`

describe('html', () => {
  bench('traverseHtml', async () => {
    const tags: string[] = []
    await traverseHtml(
      html,
      '/index.html',
      () => {},
      (node) => {
        if (node.nodeName === 'img' || node.nodeName === 'script') {
          tags.push(node.nodeName)
        }
      },
    )
  })
})

const tsCode = Array.from(
  { length: 100 },
  (_, i) => `
interface Props${i} { id: number; name: string; tags?: string[] }
export function component${i}(props: Props${i}): string {
  const { id, name, tags = [] } = props
  return \`<div id="\${id}">\${name} \${tags.join(',')}</div>\`
}
export const Element${i} = () => <div className="el-${i}">{component${i}({ id: ${i}, name: 'n' })}</div>
`,
).join('\n')

describe('oxc', () => {
  bench('transformWithOxc tsx', async () => {
    await transformWithOxc(tsCode, '/src/component.tsx', {
      jsx: { runtime: 'automatic' },
    })
  })
})
