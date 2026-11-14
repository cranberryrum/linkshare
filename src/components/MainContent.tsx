import React, { useState, useEffect } from 'react'
import { DropForm } from './DropForm'
import { RetrieveForm } from './RetrieveForm'

export const MainContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'drop' | 'retrieve'>('drop')
  const [initialCode, setInitialCode] = useState<string | null>(null)

  const handleTabChange = (tab: 'drop' | 'retrieve') => {
    if ('vibrate' in navigator) {
      navigator.vibrate(5)
    }
    setActiveTab(tab)
  }

  // ?code=1234 (from a QR scan): open the retrieve tab and let RetrieveForm do
  // the single lookup, so it shows any error and isn't counted twice.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code')
    if (code) {
      setActiveTab('retrieve')
      setInitialCode(code)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  return (
    <div className="max-w-md mx-auto p-4 w-full min-h-[500px]">
      <div className="mb-8 bg-gray-100 p-1 rounded-full w-full">
        <div className="relative grid grid-cols-2 gap-1">
          <div
            aria-hidden
            className="tab-pill absolute inset-y-0 left-0 w-[calc(50%-2px)] rounded-full bg-white"
            style={{ transform: activeTab === 'drop' ? 'translateX(0)' : 'translateX(calc(100% + 4px))' }}
          />
          <button
            className={`
              relative py-3 px-6 rounded-full font-medium transition-colors duration-200 text-base
              ${activeTab === 'drop'
                ? 'text-gray-900'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
            onClick={() => handleTabChange('drop')}
          >
            Drop
          </button>
          <button
            className={`
              relative py-3 px-6 rounded-full font-medium transition-colors duration-200 text-base
              ${activeTab === 'retrieve'
                ? 'text-gray-900'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
            onClick={() => handleTabChange('retrieve')}
          >
            Receive
          </button>
        </div>
      </div>

      {activeTab === 'drop' ? (
        <DropForm />
      ) : (
        <RetrieveForm initialCode={initialCode} />
      )}
    </div>
  )
}