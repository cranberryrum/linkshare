import React from 'react'
import { renderToString } from 'react-dom/server'
import App from './App'

// Used only at build time (scripts/prerender.mjs) to bake the first screen
// into index.html, so crawlers and slow phones get real HTML before any JS.
export const render = () =>
  renderToString(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
