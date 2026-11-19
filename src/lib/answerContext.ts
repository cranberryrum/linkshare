import { getUsage } from './usage'
import { isStandalone } from './install'
import { getCountry } from './geo'

// Context sent with a quick answer (see the quick_answer_context migration).
// No IP, no content, no name: a country code, the anonymous device ID the app
// already uses, local usage counts and basic device facts.

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
    country: await getCountry(),
    device_id: deviceId,
    ...getUsage(),
    device_type: deviceType(),
    is_installed: isStandalone(),
    page: window.location.pathname,
    language: navigator.language || null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null
  }
}
