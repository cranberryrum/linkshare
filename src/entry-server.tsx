import React from 'react'
import { renderToString } from 'react-dom/server'
import App from './App'
import { PAGES, type Page } from './content/pages'

// Used only at build time (scripts/prerender.mjs) to bake each page's first
// screen into HTML, so crawlers and slow phones get real content before any JS.
export { PAGES }

export const render = (page: Page) =>
  renderToString(
    <React.StrictMode>
      <App page={page} />
    </React.StrictMode>
  )
