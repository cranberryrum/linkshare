import React from 'react'
import { Copy, ExternalLink } from 'lucide-react'
import { useCountdown } from '../hooks/useCountdown'
import { toast } from 'sonner'

interface RetrieveResultProps {
  content: string
  code: string
  expiresAt: number
  onReset: () => void
}

export const RetrieveResult: React.FC<RetrieveResultProps> = ({
  content,
  code,
  expiresAt,
  onReset
}) => {
  const { minutes, seconds, isExpired } = useCountdown(expiresAt)
  
  const isUrl = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?$/.test(content)

  const copyContent = () => {
    navigator.clipboard.writeText(content).then(() => {
      if ('vibrate' in navigator) {
        navigator.vibrate(5)
      }
      toast.success('Content copied to clipboard', { icon: '✓' })
    }).catch(() => {
      toast.error('Failed to copy content', { icon: '✕' })
    })
  }

  const openUrl = () => {
    let url = content
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url
    }
    window.open(url, '_blank')
  }

  const renderContent = () => {
    if (isUrl) {
      return (
        <a
          href={/^https?:\/\//i.test(content) ? content : `https://${content}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-app-blue hover:underline"
        >
          {content}
        </a>
      )
    }
    return content
  }

  return (
    <div className="card p-6 w-full animate-scale-in">
      <h2 className="text-xl font-semibold mb-4">Retrieved Content</h2>
      
      <div className="mb-6">
        <div className="bg-gray-50/80 backdrop-blur-sm p-4 rounded-app-button border border-app-border mb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="break-words flex-grow overflow-auto max-h-[200px] pr-2">
              {renderContent()}
            </div>
            <button
              onClick={copyContent}
              className="shrink-0 text-gray-500 hover:text-app-blue transition-colors ml-2"
              disabled={isExpired}
            >
              <Copy className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {isExpired ? (
          <p className="text-red-500 font-medium text-sm">
            This content has expired
          </p>
        ) : (
          <p className="text-app-text-secondary text-sm">
            Expires in {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
          </p>
        )}
      </div>

      {!isExpired && (
        <div className="mb-6 bg-blue-50 p-4 rounded-app-button border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-app-blue font-medium">Share this content</span>
          </div>
          <p className="text-sm text-gray-600">
            Others can access this content using code: <span className="font-medium">{code}</span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {isUrl && (
          <button
            onClick={openUrl}
            className="btn btn-primary flex items-center justify-center col-span-2"
            disabled={isExpired}
          >
            <ExternalLink className="h-5 w-5 mr-2 shrink-0" />
            Open
          </button>
        )}
      </div>

      <button
        onClick={onReset}
        className="btn btn-secondary w-full mt-3"
      >
        Retrieve Another
      </button>
    </div>
  )
}