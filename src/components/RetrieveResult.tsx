import React, { useState, useRef, useEffect } from 'react'
import { ExternalLink, RotateCcw } from 'lucide-react'
import { useCountdown } from '../hooks/useCountdown'
import { toast } from 'sonner'
import { CopyIcon } from './CopyIcon'
import { ContentPreview, isUrlContent, toHref } from './ContentPreview'
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
  const { label, isExpired } = useCountdown(expiresAt)
  const [copied, setCopied] = useState(false)
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>()
  const isUrl = isUrlContent(content)

  useEffect(() => () => clearTimeout(copiedTimer.current), [])

  const trackOpen = () => posthog.capture('content_link_opened', { code, ...getLinkMeta(content) })

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
    trackOpen()
    window.open(toHref(content), '_blank', 'noopener,noreferrer')
  }

  const copyButton = (primary: boolean) => (
    <button
      onClick={copyContent}
      className={`btn ${primary ? 'btn-primary' : 'btn-secondary'} flex-1 flex items-center justify-center gap-2 text-sm`}
    >
      <CopyIcon copied={copied} className="h-4 w-4 shrink-0" />
      {copied ? 'Copied' : isUrl ? 'Copy link' : 'Copy text'}
    </button>
  )

  return (
    <div className="card p-6 w-full stagger-item" style={{ '--i': 0 } as React.CSSProperties}>
      <div className="flex items-baseline justify-between gap-3 mb-4 stagger-item" style={{ '--i': 1 } as React.CSSProperties}>
        <h2 className="text-lg font-semibold text-gray-900">Received</h2>
        <span className={`text-xs tabular-nums ${isExpired ? 'text-red-500' : 'text-gray-500'}`}>
          {isExpired ? 'Expired' : `Code ${code} · expires in ${label}`}
        </span>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 stagger-item" style={{ '--i': 2 } as React.CSSProperties}>
        <ContentPreview content={content} onLinkClick={trackOpen} />
      </div>

      {/* One obvious next step: open links, copy text */}
      <div className="mt-5 flex gap-2 stagger-item" style={{ '--i': 3 } as React.CSSProperties}>
        {isUrl ? (
          <>
            <button
              onClick={openUrl}
              className="btn btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
            >
              <ExternalLink className="h-4 w-4 shrink-0" />
              Open
            </button>
            {copyButton(false)}
          </>
        ) : (
          copyButton(true)
        )}
      </div>

      <button
        onClick={onReset}
        className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl py-2 text-sm text-gray-500 hover:text-gray-900 transition-colors stagger-item"
        style={{ '--i': 4 } as React.CSSProperties}
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Enter another code
      </button>
    </div>
  )
}
