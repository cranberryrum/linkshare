import React, { useState, useRef, useEffect } from 'react'
import { ExternalLink } from 'lucide-react'
import { useCountdown } from '../hooks/useCountdown'
import { toast } from 'sonner'
import { CopyIcon } from './CopyIcon'
import posthog from 'posthog-js'
import { getLinkMeta } from '../utils/linkMeta'

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
  const [copied, setCopied] = useState(false)
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => () => clearTimeout(copiedTimer.current), [])
  
  const isUrl = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?$/.test(content)

  const copyContent = () => {
    posthog.capture('content_copied', { code, ...getLinkMeta(content) })
    navigator.clipboard.writeText(content).then(() => {
      if ('vibrate' in navigator) {
        navigator.vibrate(5)
      }
      setCopied(true)
      clearTimeout(copiedTimer.current)
      copiedTimer.current = setTimeout(() => setCopied(false), 1500)
    }).catch(() => {
      toast.error('Failed to copy content', { icon: '✕' })
    })
  }

  const openUrl = () => {
    posthog.capture('content_link_opened', { code, ...getLinkMeta(content) })
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
          onClick={() => posthog.capture('content_link_opened', { code, ...getLinkMeta(content) })}
        >
          {content}
        </a>
      )
    }
    return content
  }

  return (
    <div className="card p-6 w-full animate-scale-in">
      <h2 className="text-lg font-semibold mb-6 text-gray-900">Retrieved Content</h2>
      
      <div className="mb-6">
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="break-words flex-grow overflow-auto max-h-[200px] pr-2 text-sm text-gray-900">
              {renderContent()}
            </div>
            <button
              onClick={copyContent}
              className="shrink-0 text-gray-400 hover:text-blue-500 transition-colors ml-2"
              disabled={isExpired}
            >
              <CopyIcon copied={copied} className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {isExpired ? (
          <p className="text-red-500 font-medium text-xs">
            This content has expired
          </p>
        ) : (
          <p className="text-gray-500 text-xs">
            Expires in {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
          </p>
        )}
      </div>

      {!isExpired && (
        <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-600 font-medium text-sm">Share this content</span>
          </div>
          <p className="text-xs text-gray-600">
            Others can access this content using code: <span className="font-medium">{code}</span>
          </p>
        </div>
      )}

      <div className="mb-4">
        {isUrl && (
          <button
            onClick={openUrl}
            className="btn btn-primary w-full flex items-center justify-center text-sm"
            disabled={isExpired}
          >
            <ExternalLink className="h-4 w-4 mr-2 shrink-0" />
            Open
          </button>
        )}
      </div>

      <button
        onClick={onReset}
        className="btn btn-secondary w-full text-sm"
      >
        Retrieve Another
      </button>
    </div>
  )
}