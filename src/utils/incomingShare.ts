// Content handed to Linkshare from outside the page:
// - Android share sheet (manifest share_target): /?title=…&text=…&url=…
// - iPhone Shortcut:                          /?via=shortcut&text=…
// - "Send to Linkshare" bookmarklet:           /?via=bookmarklet&url=… (or &text=…)

export type ShareVia = 'share_target' | 'shortcut' | 'bookmarklet'

export interface IncomingShare {
  content: string
  via: ShareVia
}

const MAX = 400
const URL_IN_TEXT = /https?:\/\/[^\s]+/i
const SHARE_KEYS = ['url', 'text', 'title', 'via'] as const

export const readIncomingShare = (params: URLSearchParams): IncomingShare | null => {
  const url = params.get('url')?.trim() ?? ''
  const text = params.get('text')?.trim() ?? ''
  const title = params.get('title')?.trim() ?? ''

  let content = ''
  if (url) {
    // A shared page: the link is what matters; titles are noise on the other device
    content = url
  } else if (text) {
    // Many Android apps put the link inside "text" ("Check this out https://…")
    const found = text.match(URL_IN_TEXT)?.[0]
    content = text.length > MAX && found ? found : text
  } else if (title) {
    content = title
  }

  if (!content) return null

  const viaParam = params.get('via')
  const via: ShareVia = viaParam === 'shortcut' || viaParam === 'bookmarklet' ? viaParam : 'share_target'
  return { content: content.slice(0, MAX), via }
}

// Remove the share params so a reload doesn't re-fill the form
export const withoutShareParams = (params: URLSearchParams) => {
  const next = new URLSearchParams(params)
  SHARE_KEYS.forEach(k => next.delete(k))
  const qs = next.toString()
  return window.location.pathname + (qs ? `?${qs}` : '')
}
