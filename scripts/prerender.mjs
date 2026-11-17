// Runs after `vite build` + `vite build --ssr`: renders every page in
// src/content/pages.ts to HTML and writes one file per URL (dist/index.html,
// dist/<slug>/index.html), each with its own title, description and canonical.
// Search engines, link unfurlers and AI crawlers get real content without JS.
import { readFile, writeFile, readdir, rm, mkdir } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const SITE = 'https://linkshare.live'
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

const { render, PAGES } = await import(pathToFileURL(path.join(serverDir, 'entry-server.js')).href)
const template = await readFile(path.join(dist, 'index.html'), 'utf8')

if (!template.includes('<div id="root"></div>')) {
  throw new Error('prerender: <div id="root"></div> not found in dist/index.html')
}

const escape = s =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Replace the content of one tag in <head>; fail loudly if the tag is missing
const setTag = (html, pattern, replacement) => {
  if (!pattern.test(html)) throw new Error(`prerender: no match for ${pattern}`)
  return html.replace(pattern, replacement)
}

// Preload the main text font so the first paint doesn't wait to discover it
const assets = await readdir(path.join(dist, 'assets'))
const font = assets.find(f => /^figtree-latin-wght-normal-.*\.woff2$/.test(f))

const sitemap = []
const today = new Date().toISOString().slice(0, 10)

for (const page of PAGES) {
  const url = SITE + page.path
  const title = escape(page.title)
  const description = escape(page.description)

  let html = template.replace('<div id="root"></div>', `<div id="root">${render(page)}</div>`)
  html = setTag(html, /<title>[^<]*<\/title>/, `<title>${title}</title>`)
  html = setTag(html, /(<meta name="description" content=")[^"]*/, `$1${description}`)
  html = setTag(html, /(<link rel="canonical" href=")[^"]*/, `$1${url}`)
  html = setTag(html, /(<meta property="og:url" content=")[^"]*/, `$1${url}`)
  html = setTag(html, /(<meta property="og:title" content=")[^"]*/, `$1${title}`)
  html = setTag(html, /(<meta property="og:description" content=")[^"]*/, `$1${description}`)
  html = setTag(html, /(<meta name="twitter:title" content=")[^"]*/, `$1${title}`)
  html = setTag(html, /(<meta name="twitter:description" content=")[^"]*/, `$1${description}`)
  if (font) {
    html = html.replace(
      '</title>',
      `</title>\n    <link rel="preload" href="/assets/${font}" as="font" type="font/woff2" crossorigin />`
    )
  }

  const dir = path.join(dist, page.slug)
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, 'index.html'), html)
  sitemap.push(`  <url>\n    <loc>${url}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`)
  console.log(`prerender: ${page.path}`)
}

// Sitemap is generated from the same page list, so it can't drift
await writeFile(
  path.join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap.join('\n')}\n</urlset>\n`
)

await rm(serverDir, { recursive: true, force: true })
