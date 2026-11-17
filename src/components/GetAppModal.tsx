import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Bookmark, Download, PlusSquare, Share, Send, CheckCircle2, X } from 'lucide-react'
import { toast } from 'sonner'
import { analytics } from '../lib/analytics'
import {
  canPromptInstall,
  isStandalone,
  promptInstall,
  subscribeInstall,
  wasInstalled
} from '../lib/install'
import { BOOKMARKLET, IOS_SHORTCUT_URL } from '../content/quickAccess'
import { closeGetApp, useGetAppOpen } from '../lib/getApp'
import { usePresence } from '../hooks/usePresence'

type Platform = 'iphone' | 'android' | 'computer'

const PLATFORMS: { id: Platform; label: string }[] = [
  { id: 'iphone', label: 'iPhone' },
  { id: 'android', label: 'Android' },
  { id: 'computer', label: 'Computer' }
]

const CLIP = [
  'inset(0 66.667% 0 0 round 9999px)',
  'inset(0 33.333% 0 33.333% round 9999px)',
  'inset(0 0 0 66.667% round 9999px)'
]

const detectPlatform = (): Platform => {
  const ua = navigator.userAgent
  // iPadOS reports itself as a Mac; touch support gives it away
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'iphone'
  if (/Android/.test(ua)) return 'android'
  return 'computer'
}

const useInstallState = () => {
  const canInstall = useSyncExternalStore(subscribeInstall, canPromptInstall, () => false)
  const installed = useSyncExternalStore(subscribeInstall, wasInstalled, () => false)
  return { canInstall, installed }
}

const Row: React.FC<{
  icon: React.ReactNode
  title: string
  children: React.ReactNode
  action?: React.ReactNode
}> = ({ icon, title, children, action }) => (
  <li className="flex gap-4 px-5 py-4">
    <span
      aria-hidden
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"
    >
      {icon}
    </span>
    <div className="min-w-0 flex-1">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <div className="mt-0.5 text-sm leading-relaxed text-gray-500">{children}</div>
      {action && <div className="mt-3">{action}</div>}
    </div>
  </li>
)

const InlineIcon: React.FC<{ children: React.ReactNode; label: string }> = ({ children, label }) => (
  <span className="inline-flex translate-y-[2px] items-center text-gray-700" role="img" aria-label={label}>
    {children}
  </span>
)

// "Get the app" popup: bottom sheet on phones, centred dialog on larger screens.
// Only mounted while open, so it can read the device straight away.
export const GetAppModal: React.FC = () => {
  const isOpen = useGetAppOpen()
  const { isMounted, isClosing, onExitEnd } = usePresence(isOpen)
  if (!isMounted) return null
  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm sm:items-center sm:p-4 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
      onAnimationEnd={onExitEnd}
      onClick={e => { if (e.target === e.currentTarget) closeGetApp() }}
    >
      <GetAppDialog closing={isClosing} />
    </div>
  )
}

const GetAppDialog: React.FC<{ closing: boolean }> = ({ closing }) => {
  const [platform, setPlatform] = useState<Platform>(detectPlatform)
  const [standalone] = useState(isStandalone)
  const [isMac] = useState(() => /Mac/.test(navigator.platform) || /Macintosh/.test(navigator.userAgent))
  const { canInstall, installed } = useInstallState()
  const closeRef = useRef<HTMLButtonElement>(null)

  // Escape closes, focus starts on the dialog, and the page behind doesn't scroll
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeGetApp() }
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [])

  const choose = (p: Platform) => {
    setPlatform(p)
    analytics.capture('quick_access_tab', { platform: p })
  }

  const install = async () => {
    const outcome = await promptInstall()
    analytics.capture('install_prompt', { outcome, platform })
  }

  const installButton = canInstall && (
    <button onClick={install} className="btn btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm">
      <Download className="h-4 w-4 shrink-0" />
      Install Linkshare
    </button>
  )

  const appReady = standalone || installed

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="get-heading"
      className={`sheet relative max-h-[90svh] w-full overflow-y-auto rounded-t-2xl border border-gray-200 bg-[#F7F8FA] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:max-w-md sm:rounded-2xl sm:p-6 ${closing ? 'animate-scale-out' : 'animate-scale-in'}`}
    >
      <button
        ref={closeRef}
        onClick={closeGetApp}
        aria-label="Close"
        className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="h-5 w-5" />
      </button>
      <h2 id="get-heading" className="pr-8 text-lg font-semibold text-gray-900">
        Get Linkshare
      </h2>
      <p className="mt-1 mb-4 text-sm text-gray-500">
        Open it in one tap, or send links to it straight from other apps.
      </p>

      <div
        role="tablist"
        aria-label="Your device"
        className="relative mb-3 grid grid-cols-3 rounded-full bg-gray-100 p-1"
      >
        {PLATFORMS.map(p => (
          <button
            key={p.id}
            role="tab"
            aria-selected={platform === p.id}
            onClick={() => choose(p.id)}
            className="relative rounded-full py-2 text-sm font-medium text-gray-500 transition-colors duration-150 hover:text-gray-700"
          >
            {p.label}
          </button>
        ))}
        <div
          aria-hidden
          className="seg-active-layer pointer-events-none select-none absolute inset-1 grid grid-cols-3"
          style={{ clipPath: CLIP[PLATFORMS.findIndex(p => p.id === platform)] }}
        >
          {PLATFORMS.map(p => (
            <span
              key={p.id}
              className="flex items-center justify-center rounded-full bg-white py-2 text-sm font-medium text-gray-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
            >
              {p.label}
            </span>
          ))}
        </div>
      </div>

      {appReady && platform !== 'computer' && (
        <p className="mb-3 flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Linkshare is installed on this device.
        </p>
      )}

      <ul key={platform} role="tabpanel" className="card divide-y divide-gray-200 tab-swap">
        {platform === 'iphone' && (
          <>
            <Row icon={<PlusSquare className="h-4 w-4" />} title="Add to Home Screen">
              In Safari, tap Share{' '}
              <InlineIcon label="Share"><Share className="h-4 w-4" /></InlineIcon>{' '}
              then <span className="font-medium text-gray-700">Add to Home Screen</span>. Linkshare opens
              full screen, like an app.
            </Row>
            {IOS_SHORTCUT_URL && (
              <Row
                icon={<Send className="h-4 w-4" />}
                title="Send from any app"
                action={
                  <a
                    href={IOS_SHORTCUT_URL}
                    onClick={() => analytics.capture('ios_shortcut_clicked')}
                    className="btn btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm"
                  >
                    <Download className="h-4 w-4 shrink-0" />
                    Get the Shortcut
                  </a>
                }
              >
                Add the Linkshare Shortcut, then in Safari or any app tap Share{' '}
                <InlineIcon label="Share"><Share className="h-4 w-4" /></InlineIcon>{' '}
                and pick <span className="font-medium text-gray-700">Send to Linkshare</span>. The link lands
                in the Drop box, ready to go.
              </Row>
            )}
          </>
        )}

        {platform === 'android' && (
          <>
            <Row
              icon={<Download className="h-4 w-4" />}
              title="Install the app"
              action={installButton}
            >
              {canInstall
                ? 'One tap adds Linkshare to your home screen and app drawer.'
                : <>In Chrome, tap the <span className="font-medium text-gray-700">⋮</span> menu, then{' '}
                    <span className="font-medium text-gray-700">Install app</span> or{' '}
                    <span className="font-medium text-gray-700">Add to Home screen</span>.</>}
            </Row>
            <Row icon={<Send className="h-4 w-4" />} title="Send from any app">
              Once installed, tap Share in any app and pick{' '}
              <span className="font-medium text-gray-700">Linkshare</span>. The link lands in the Drop box,
              ready to go.
            </Row>
          </>
        )}

        {platform === 'computer' && (
          <>
            <Row
              icon={<Send className="h-4 w-4" />}
              title="Send to Linkshare button"
              action={
                <a
                  // React warns about javascript: URLs in JSX, so set it on the element directly
                  ref={el => el?.setAttribute('href', BOOKMARKLET)}
                  href="#"
                  draggable
                  onClick={e => {
                    e.preventDefault()
                    toast('Drag the button to your bookmarks bar', {
                      description: 'Then click it on any page to send that page to Linkshare.'
                    })
                  }}
                  onDragEnd={() => analytics.capture('bookmarklet_dragged')}
                  className="btn btn-secondary inline-flex cursor-grab items-center gap-2 px-4 py-2 text-sm active:cursor-grabbing"
                  title="Drag me to your bookmarks bar"
                >
                  <Send className="h-4 w-4 shrink-0 text-blue-600" />
                  Send to Linkshare
                </a>
              }
            >
              Drag this button to your bookmarks bar. On any page, click it to open Linkshare with that
              page’s link ready to drop. Select some text first to send the text instead.
            </Row>
            <Row icon={<Bookmark className="h-4 w-4" />} title="Bookmark linkshare.live">
              Press{' '}
              <kbd className="rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono text-xs text-gray-700">
                {isMac ? '⌘ D' : 'Ctrl D'}
              </kbd>{' '}
              to save it, so it’s always one click away.
            </Row>
            {canInstall && (
              <Row icon={<Download className="h-4 w-4" />} title="Install as an app" action={installButton}>
                Opens in its own window and stays in your dock or taskbar.
              </Row>
            )}
          </>
        )}
      </ul>
    </div>
  )
}
