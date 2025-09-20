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
    <div className="max-w-md mx-auto p-4 w-full min-h-[500px]">
      <div className="mb-8 bg-gray-100 p-1 rounded-2xl max-w-sm mx-auto">
        <div className="grid grid-cols-2 gap-2">
          <button
            className={`
              py-2 px-4 rounded-xl font-medium transition-all duration-300 text-sm
              ${activeTab === 'drop' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
            onClick={() => handleTabChange('drop')}
          >
            Drop
          </button>
          <button
            className={`
              py-2 px-4 rounded-xl font-medium transition-all duration-300 text-sm
              ${activeTab === 'retrieve' 
                ? 'bg-white text-gray-900 shadow-sm' 
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