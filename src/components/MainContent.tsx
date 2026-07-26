import React, { useState, useEffect } from 'react'
import { DropForm } from './DropForm'
import { RetrieveForm } from './RetrieveForm'
import { useLinks } from '../contexts/LinkContext'

export const MainContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'drop' | 'retrieve'>('drop')
  const [initialCode, setInitialCode] = useState<string | null>(null)
  const { getLink } = useLinks()

  const handleTabChange = (tab: 'drop' | 'retrieve') => {
    if (tab === activeTab) return
    if ('vibrate' in navigator) {
      navigator.vibrate(5)
    }
    setActiveTab(tab)
  }

  useEffect(() => {
    const checkUrlCode = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')

      if (code) {
        try {
          const link = await getLink(code)
          if (link) {
            setActiveTab('retrieve')
            setInitialCode(code)
            window.history.replaceState({}, '', window.location.pathname)
          }
        } catch (error) {
          console.error('Error checking code from URL:', error)
        }
      }
    }

    checkUrlCode()
  }, [getLink])

  return (
    <div className="max-w-md mx-auto w-full min-w-0 min-h-[480px] overflow-visible">
      <div className="mb-8 segmented-control" role="tablist" aria-label="Share mode">
        <div
          className="segmented-indicator"
          data-active={activeTab}
          aria-hidden="true"
        />
        <button
          role="tab"
          aria-selected={activeTab === 'drop'}
          className="segmented-button"
          data-active={activeTab === 'drop'}
          onPointerDown={() => activeTab !== 'drop' && handleTabChange('drop')}
        >
          Drop
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'retrieve'}
          className="segmented-button"
          data-active={activeTab === 'retrieve'}
          onPointerDown={() => activeTab !== 'retrieve' && handleTabChange('retrieve')}
        >
          Receive
        </button>
      </div>

      <div className="panel-container">
        <div
          role="tabpanel"
          aria-hidden={activeTab !== 'drop'}
          className="panel"
          data-active={activeTab === 'drop'}
        >
          <DropForm />
        </div>
        <div
          role="tabpanel"
          aria-hidden={activeTab !== 'retrieve'}
          className="panel"
          data-active={activeTab === 'retrieve'}
        >
          <RetrieveForm initialCode={initialCode} />
        </div>
      </div>
    </div>
  )
}
