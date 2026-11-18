import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource-variable/figtree'
import '@fontsource/jetbrains-mono/600.css'
import '@fontsource/jetbrains-mono/700.css'
import App from './App.tsx'
import { initAnalytics } from './lib/analytics'
import { listenForInstallPrompt } from './lib/install'
import { recordVisit } from './lib/usage'
import { pageForPath } from './content/pages'
import './index.css'

listenForInstallPrompt()
// Before the app runs, so a brand-new device is told apart from a returning one
recordVisit()

const root = document.getElementById('root')!
const app = (
  <React.StrictMode>
    <App page={pageForPath(window.location.pathname)} />
  </React.StrictMode>
)

// Production HTML is prerendered at build time: attach to it instead of
// re-drawing it. In dev the root is empty, so render from scratch.
if (root.hasChildNodes()) {
  ReactDOM.hydrateRoot(root, app)
} else {
  ReactDOM.createRoot(root).render(app)
}

initAnalytics()
