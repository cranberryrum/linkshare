// Captures the browser's "install this app" prompt (Chrome/Edge/Samsung on
// Android and desktop). The event can fire before React hydrates, so this is
// registered at startup from main.tsx and components subscribe to it.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: BeforeInstallPromptEvent | null = null
let installed = false
const listeners = new Set<() => void>()
const notify = () => listeners.forEach(l => l())

export const listenForInstallPrompt = () => {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault() // we show our own button instead of the mini-infobar
    deferred = e as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    installed = true
    deferred = null
    notify()
  })
}

export const subscribeInstall = (listener: () => void) => {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export const canPromptInstall = () => deferred !== null
export const wasInstalled = () => installed

export const promptInstall = async () => {
  if (!deferred) return 'unavailable' as const
  const event = deferred
  deferred = null
  notify()
  await event.prompt()
  const { outcome } = await event.userChoice
  return outcome
}

// Already running as an installed app (home screen / dock)
export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true
