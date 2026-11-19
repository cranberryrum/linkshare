// The visitor's country as a 2-letter code, from Netlify's edge geo lookup
// (netlify/edge-functions/geo.ts). Looked up once per page and cached; gives
// up after 1.5s. Used for the country on links and on quick answers.
let countryPromise: Promise<string | null> | null = null

export const getCountry = () => {
  if (!countryPromise) {
    const signal = 'timeout' in AbortSignal ? AbortSignal.timeout(1500) : undefined
    countryPromise = fetch('/api/geo', { cache: 'no-store', signal })
      .then(r => (r.ok ? r.json() : null))
      .then(d => (typeof d?.country === 'string' ? d.country : null))
      .catch(() => null)
  }
  return countryPromise
}

// Waits at most `ms` for the country, so it never slows anything down
export const getCountryQuickly = (ms: number) =>
  Promise.race([getCountry(), new Promise<null>(resolve => setTimeout(() => resolve(null), ms))])

// Start the lookup in the background once the page has settled,
// so it's ready by the time someone drops a link
export const prefetchCountry = () => {
  const start = () => { void getCountry() }
  const idle = () =>
    'requestIdleCallback' in window ? window.requestIdleCallback(start, { timeout: 3000 }) : setTimeout(start, 1)
  if (document.readyState === 'complete') idle()
  else window.addEventListener('load', idle, { once: true })
}
