import React, { useState, useRef, useEffect } from 'react'
import { PlusCircle, Pen } from 'lucide-react'
import QRCode from 'react-qr-code'
import { useCountdown } from '../hooks/useCountdown'
import { toast } from 'sonner'
import { CopyIcon } from './CopyIcon'
import { ContentPreview } from './ContentPreview'
import posthog from 'posthog-js'

interface DropResultProps {
  code: string
  content: string
  createdAt: number
  expiresAt: number
  onReset: () => void
  onEdit: (content: string) => void
}

export const DropResult: React.FC<DropResultProps> = ({
  code,
  content,
  createdAt,
  expiresAt,
  onReset,
  onEdit
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(content)
  const { msLeft, label, isExpired } = useCountdown(expiresAt)
  const [copied, setCopied] = useState(false)
  // Bar starts empty, draws in to the time left, then drains linearly
  const [barIntro, setBarIntro] = useState<'start' | 'drawing' | 'done'>('start')
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => () => clearTimeout(copiedTimer.current), [])

  useEffect(() => {
    // Wait for the tiles to land, then draw the bar in
    const draw = setTimeout(() => setBarIntro('drawing'), 260)
    const done = setTimeout(() => setBarIntro('done'), 260 + 720)
    return () => { clearTimeout(draw); clearTimeout(done) }
  }, [])

  // Share of the lifetime left; "ending soon" = last minute, or last 10% of long links
  const total = Math.max(1, expiresAt - createdAt)
  const remaining = Math.min(1, msLeft / total)
  const endingSoon = !isExpired && msLeft <= Math.max(60_000, total * 0.1)

  const copyCode = () => {
    posthog.capture('code_copied', { code })
    navigator.clipboard.writeText(code).then(() => {
      if ('vibrate' in navigator) {
        navigator.vibrate(5)
      }
      setCopied(true)
      clearTimeout(copiedTimer.current)
      copiedTimer.current = setTimeout(() => setCopied(false), 1500)
    }).catch(() => {
      toast.error('Failed to copy code', {
        style: { background: '#fee2e2', borderColor: '#fca5a5' },
        icon: '✕'
      })
    })
  }

  const handleSave = () => {
    if (editContent.length > 400) {
      toast.error('Content exceeds 400 character limit', {
        style: { background: '#fee2e2', borderColor: '#fca5a5' }
      })
      return
    }
    onEdit(editContent)
    setIsEditing(false)
  }

  const qrValue = `${window.location.origin}/?code=${code}`

  return (
    <div className="card p-6 w-full stagger-item" style={{ '--i': 0 } as React.CSSProperties}>
      {/* The code is the product: big, spaced, easy to read aloud or across a room */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2" aria-label={`Code ${code.split('').join(' ')}`}>
          {code.split('').map((digit, i) => (
            <span
              key={i}
              aria-hidden
              style={{ '--i': i } as React.CSSProperties}
              className={`code-tile flex h-16 w-12 sm:h-[72px] sm:w-14 items-center justify-center rounded-xl border font-mono text-[34px] sm:text-[38px] font-bold
                ${isExpired ? 'border-gray-200 bg-gray-50 text-gray-300' : 'border-blue-100 bg-blue-50 text-blue-500'}`}
            >
              {digit}
            </span>
          ))}
        </div>
        <button
          onClick={copyCode}
          className="btn btn-secondary flex h-11 w-11 items-center justify-center p-0"
          disabled={isExpired}
          aria-label="Copy code"
        >
          <CopyIcon copied={copied} className="h-5 w-5 shrink-0" />
        </button>
      </div>

      {/* Time left: a bar that drains, so it reads at a glance */}
      <div className="mt-5 stagger-item" style={{ '--i': 4 } as React.CSSProperties}>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            data-intro={barIntro !== 'done'}
            className={`expiry-bar h-full w-full origin-left rounded-full ${endingSoon ? 'bg-amber-400' : 'bg-app-blue'}`}
            style={{ transform: `scaleX(${barIntro === 'start' ? 0 : remaining})` }}
          />
        </div>
        <p className={`mt-2 text-xs tabular-nums ${isExpired ? 'text-red-500' : endingSoon ? 'text-amber-600' : 'text-gray-500'}`}>
          {isExpired ? 'This code has expired' : `Expires in ${label}`}
        </p>
      </div>

      <div className="mt-5 flex items-center gap-4 rounded-xl border border-gray-200 p-3 stagger-item" style={{ '--i': 5 } as React.CSSProperties}>
        <QRCode value={qrValue} size={88} style={{ height: '88px', width: '88px', flexShrink: 0 }} viewBox="0 0 88 88" />
        <p className="text-sm text-gray-500">
          On the other device, open <span className="font-medium text-gray-900">linkshare.live</span> and enter the code, or scan this.
        </p>
      </div>

      {isEditing ? (
        <div className="mt-4 tab-swap">
          <textarea
            className="input-field min-h-[100px] resize-none mb-2 text-sm"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            maxLength={400}
          />
          <div className="text-right mb-2 text-gray-500 text-xs">
            {editContent.length}/400 characters
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="btn btn-primary flex-1 text-sm">
              Save
            </button>
            <button
              onClick={() => {
                setIsEditing(false)
                setEditContent(content)
              }}
              className="btn btn-secondary flex-1 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 stagger-item" style={{ '--i': 6 } as React.CSSProperties}>
          <div className="min-w-0 flex-1">
            <ContentPreview content={content} />
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="shrink-0 rounded-lg p-2 text-gray-400 hover:text-app-blue transition-colors"
            disabled={isExpired}
            aria-label="Edit content"
          >
            <Pen className="h-4 w-4" />
          </button>
        </div>
      )}

      <button
        onClick={onReset}
        className="btn btn-secondary w-full mt-4 flex items-center justify-center text-sm stagger-item"
        style={{ '--i': 7 } as React.CSSProperties}
      >
        <PlusCircle className="h-4 w-4 mr-2 shrink-0" />
        New Drop
      </button>
    </div>
  )
}
