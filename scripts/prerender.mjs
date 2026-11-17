// Runs after `vite build` + `vite build --ssr`: renders the first screen to
// HTML and writes it into dist/index.html, so the page has real content
// before JavaScript loads (for search engines, link unfurlers and AI crawlers).
import { readFile, writeFile, readdir, rm } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const dist = path.resolve('dist')
const serverDir = path.resolve('dist-server')

// The app reads localStorage while rendering; give it an empty one
const memory = new Map()
globalThis.localStorage = {
  getItem: k => (memory.has(k) ? memory.get(k) : null),
  setItem: (k, v) => memory.set(k, String(v)),
  removeItem: k => memory.delete(k),
  clear: () => memory.clear(),
  key: i => [...memory.keys()][i] ?? null,
  get length() { return memory.size }
}

const { render } = await import(pathToFileURL(path.join(serverDir, 'entry-server.js')).href)
const appHtml = render()

const indexPath = path.join(dist, 'index.html')
let html = await readFile(indexPath, 'utf8')

if (!html.includes('<div id="root"></div>')) {
  throw new Error('prerender: <div id="root"></div> not found in dist/index.html')
}
html = html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)

// Preload the main text font so the first paint doesn't wait to discover it
const assets = await readdir(path.join(dist, 'assets'))
const font = assets.find(f => /^figtree-latin-wght-normal-.*\.woff2$/.test(f))
if (font) {
  html = html.replace(
    '</title>',
    `</title>\n    <link rel="preload" href="/assets/${font}" as="font" type="font/woff2" crossorigin />`
  )
}

await writeFile(indexPath, html)
await rm(serverDir, { recursive: true, force: true })
console.log(`prerender: wrote ${appHtml.length} chars of HTML into dist/index.html`)
