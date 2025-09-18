import React, { useState, useEffect } from 'react'
import { DropForm } from './DropForm'
import { RetrieveForm } from './RetrieveForm'
import { useLinks } from '../contexts/LinkContext'

export const MainContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'drop' | 'retrieve'>('drop')
  const [initialCode, setInitialCode] = useState<string | null>(null)
  const { getLink } = useLinks()

  const handleTabChange = (tab: 'drop' | 'retrieve') => {
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
    <div className="container-app w-full min-h-[500px]">
      <div className="mb-8 bg-gray-100 p-1.5 rounded-full max-w-md mx-auto">
        <div className="grid grid-cols-2 gap-2">
          <button
            className={`
              py-3 px-6 rounded-full font-medium transition-all duration-300
              ${activeTab === 'drop' 
                ? 'bg-white text-app-text-primary shadow-sm' 
                : 'text-app-text-secondary hover:text-app-text-primary'
              }
            `}
            onClick={() => handleTabChange('drop')}
          >
            Drop
          </button>
          <button
            className={`
              py-3 px-6 rounded-full font-medium transition-all duration-300
              ${activeTab === 'retrieve' 
                ? 'bg-white text-app-text-primary shadow-sm' 
                : 'text-app-text-secondary hover:text-app-text-primary'
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