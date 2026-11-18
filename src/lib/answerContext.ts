import { getUsage } from './usage'
import { isStandalone } from './install'

// Context sent with a quick answer (see the quick_answer_context migration).
// No IP, no content, no name: a country code, the anonymous device ID the app
// already uses, local usage counts and basic device facts.

let countryPromise: Promise<string | null> | null = null

// Country from Netlify's edge geo lookup (netlify/edge-functions/geo.ts).
// Asked once per page, only when someone answers.
const lookupCountry = () => {
  // Never hold up the answer: give up on the country after 1.5s
  const signal = 'timeout' in AbortSignal ? AbortSignal.timeout(1500) : undefined
  countryPromise ??= fetch('/api/geo', { cache: 'no-store', signal })
    .then(r => (r.ok ? r.json() : null))
    .then(d => (typeof d?.country === 'string' ? d.country : null))
    .catch(() => null)
  return countryPromise
}

const deviceType = () => {
  const ua = navigator.userAgent
  if (/iPad|Tablet/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) || (/Android/.test(ua) && !/Mobile/.test(ua))) return 'tablet'
  if (/Mobi|iPhone|Android/i.test(ua)) return 'mobile'
  return 'desktop'
}

export const buildAnswerContext = async () => {
  let deviceId: string | null = null
  try { deviceId = localStorage.getItem('creatorId') } catch { /* ignore */ }
  return {
    country: await lookupCountry(),
    device_id: deviceId,
    ...getUsage(),
    device_type: deviceType(),
    is_installed: isStandalone(),
    page: window.location.pathname,
    language: navigator.language || null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null
  }
}
