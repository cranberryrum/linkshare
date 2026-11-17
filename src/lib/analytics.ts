import type { PostHog } from 'posthog-js'

// PostHog is ~150 KB. Load it after the page is interactive so it never
// competes with the first paint; calls made before then are queued.
type Call = (ph: PostHog) => void

let client: PostHog | null = null
const queue: Call[] = []

const run = (call: Call) => {
  if (client) call(client)
  else queue.push(call)
}

export const analytics = {
  capture: (event: string, properties?: Record<string, unknown>) =>
    run(ph => { ph.capture(event, properties) }),
  identify: (id: string) => run(ph => { ph.identify(id) })
}

export const initAnalytics = () => {
  const key = import.meta.env.VITE_POSTHOG_KEY
  if (!key) return

  const load = () => {
    import('posthog-js').then(({ default: posthog }) => {
      posthog.init(key, {
        api_host: import.meta.env.VITE_POSTHOG_HOST,
        person_profiles: 'identified_only',
        capture_pageview: true,
        capture_pageleave: true
      })
      client = posthog
      queue.splice(0).forEach(call => call(posthog))
    })
  }

  const idle = () =>
    'requestIdleCallback' in window
      ? window.requestIdleCallback(load, { timeout: 3000 })
      : setTimeout(load, 1)

  if (document.readyState === 'complete') idle()
  else window.addEventListener('load', idle, { once: true })
}
