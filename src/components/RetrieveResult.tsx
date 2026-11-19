import React, { useState, useRef, useEffect } from 'react'
import { ExternalLink, RotateCcw, Reply, EyeOff } from 'lucide-react'
import { useCountdown } from '../hooks/useCountdown'
import { toast } from 'sonner'
import { CopyIcon } from './CopyIcon'
import { ContentPreview, isUrlContent, toHref } from './ContentPreview'
import { analytics as posthog } from '../lib/analytics'
import { getLinkMeta } from '../utils/linkMeta'
import { QuickQuestion } from './QuickQuestion'

interface RetrieveResultProps {
  content: string
  code: string
  expiresAt: number
  oneView?: boolean
  onReset: () => void
  onSendBack?: () => void
}

export const RetrieveResult: React.FC<RetrieveResultProps> = ({
  content,
  code,
  expiresAt,
  oneView = false,
  onReset,
  onSendBack
}) => {
  const { label, isExpired } = useCountdown(expiresAt)
  const [copied, setCopied] = useState(false)
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>()
  const isUrl = isUrlContent(content)
  // Copied or opened: the main job is done, so the quick question can show
  const [acted, setActed] = useState(false)

  useEffect(() => () => clearTimeout(copiedTimer.current), [])

  const trackOpen = () => {
    posthog.capture('content_link_opened', { code, ...getLinkMeta(content) })
    setActed(true)
  }

  const copyContent = () => {
    posthog.capture('content_copied', { code, ...getLinkMeta(content) })
    setActed(true)
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
    <>
    <div className="card p-6 w-full stagger-item" style={{ '--i': 0 } as React.CSSProperties}>
      <div className="flex items-baseline justify-between gap-3 mb-4 stagger-item" style={{ '--i': 1 } as React.CSSProperties}>
        <h2 className="text-lg font-semibold text-gray-900">Received</h2>
        <span className={`text-xs tabular-nums ${isExpired && !oneView ? 'text-red-500' : 'text-gray-500'}`}>
          {oneView ? `Code ${code} · one view` : isExpired ? 'Expired' : `Code ${code} · expires in ${label}`}
        </span>
      </div>

      {/* It's gone from Linkshare now: make sure they keep it */}
      {oneView && (
        <p className="mb-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800 stagger-item" style={{ '--i': 1 } as React.CSSProperties}>
          <EyeOff className="mt-px h-3.5 w-3.5 shrink-0" />
          One-view link: it’s now deleted from Linkshare. Copy or open it before you leave this page.
        </p>
      )}

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

      {/* The receiver is the next sender: one tap to send something back */}
      {onSendBack && (
        <div
          className="mt-4 flex items-center justify-between gap-3 border-t border-gray-200 pt-4 text-xs text-gray-500 stagger-item"
          style={{ '--i': 5 } as React.CSSProperties}
        >
          <span>
            Sent with <span className="font-medium text-gray-700">linkshare.live</span>
          </span>
          <button
            onClick={() => {
              posthog.capture('send_back_clicked', { code })
              onSendBack()
            }}
            className="inline-flex items-center gap-1.5 font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Reply className="h-3.5 w-3.5" />
            Send something back
          </button>
        </div>
      )}

    </div>

    {/* Popup right after they copy or open it (so it's there when they come
        back to this tab), or after a few seconds if they do neither */}
    <QuickQuestion question="receive_sender" delayMs={4000} triggerNow={acted} />
    </>
  )
}
