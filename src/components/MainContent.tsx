import React, { useState, useEffect, useRef } from 'react'
import { DropForm } from './DropForm'
import { RetrieveForm } from './RetrieveForm'
import { readIncomingShare, withoutShareParams, IncomingShare } from '../utils/incomingShare'
import { analytics } from '../lib/analytics'

type Tab = 'drop' | 'retrieve'

const TABS: { id: Tab; label: string }[] = [
  { id: 'drop', label: 'Drop' },
  { id: 'retrieve', label: 'Receive' }
]

// The white pill + dark labels live in one layer that is clipped to the active
// half. Moving the clip moves pill and colour together, so the label colour can
// never lag behind the pill (gray labels sit underneath).
const CLIP: Record<Tab, string> = {
  drop: 'inset(0 calc(50% + 2px) 0 0 round 9999px)',
  retrieve: 'inset(0 0 0 calc(50% + 2px) round 9999px)'
}

export const MainContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('drop')
  const [initialCode, setInitialCode] = useState<string | null>(null)
  const [incoming, setIncoming] = useState<IncomingShare | null>(null)
  // First paint uses the page-load sequence; later switches use the quick swap
  const hasSwitched = useRef(false)

  const handleTabChange = (tab: Tab) => {
    if (tab === activeTab) return
    if ('vibrate' in navigator) {
      navigator.vibrate(5)
    }
    hasSwitched.current = true
    setActiveTab(tab)
  }

  // ?code=1234 (from a QR scan): open the retrieve tab and let RetrieveForm do
  // the single lookup, so it shows any error and isn't counted twice.
  // ?tab=receive (home-screen shortcut): open the retrieve tab.
  // ?url= / ?text= (share sheet, iPhone Shortcut, bookmarklet): fill the Drop form.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const shared = readIncomingShare(params)
    if (shared) {
      setIncoming(shared)
      analytics.capture('share_received', { via: shared.via })
      window.history.replaceState({}, '', withoutShareParams(params))
    } else if (code) {
      setActiveTab('retrieve')
      setInitialCode(code)
      window.history.replaceState({}, '', window.location.pathname)
    } else if (params.get('tab') === 'receive') {
      setActiveTab('retrieve')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  return (
    <div className="max-w-md mx-auto p-4 w-full">
      <div className="page-enter mb-8 rounded-full bg-gray-100 p-1" style={{ '--i': 1 } as React.CSSProperties}>
        <div className="relative grid grid-cols-2 gap-1" role="tablist">
          {TABS.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => handleTabChange(tab.id)}
              className="seg-btn relative rounded-full py-3 px-6 text-base font-medium text-gray-500 transition-colors duration-150 hover:text-gray-700"
            >
              {tab.label}
            </button>
          ))}

          {/* Active layer: same labels, white pill, clipped to the selected half */}
          <div
            aria-hidden
            className="seg-active-layer pointer-events-none select-none absolute inset-0 grid grid-cols-2 gap-1"
            style={{ clipPath: CLIP[activeTab] }}
          >
            {TABS.map(tab => (
              <span
                key={tab.id}
                className="flex items-center justify-center rounded-full bg-white py-3 px-6 text-base font-medium text-gray-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
              >
                {tab.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div
        key={activeTab}
        className={hasSwitched.current ? 'tab-swap' : 'page-enter'}
        style={{ '--i': 2 } as React.CSSProperties}
      >
        {activeTab === 'drop' ? (
          <DropForm incoming={incoming} />
        ) : (
          <RetrieveForm initialCode={initialCode} onSendBack={() => handleTabChange('drop')} />
        )}
      </div>
    </div>
  )
}
