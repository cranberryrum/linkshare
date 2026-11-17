import { useSyncExternalStore } from 'react'
import { analytics } from './analytics'

// One "Get the app" popup for the whole page; any button can open it.
let open = false
const listeners = new Set<() => void>()
const set = (next: boolean) => {
  open = next
  listeners.forEach(l => l())
}

export const openGetApp = (source: string) => {
  analytics.capture('get_app_opened', { source })
  set(true)
}
export const closeGetApp = () => set(false)

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => { listeners.delete(l) }
}

export const useGetAppOpen = () => useSyncExternalStore(subscribe, () => open, () => false)
