import React, { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { Send, Lock } from 'lucide-react'
import { useLinks, InputMethod, ExpiryMinutes } from '../contexts/LinkContext'
import { DropResult } from './DropResult'
import { ActiveDrops } from './ActiveDrops'
import { toast } from 'sonner'
import type { IncomingShare } from '../utils/incomingShare'

const EXPIRY_OPTIONS: { minutes: ExpiryMinutes; label: string }[] = [
  { minutes: 10, label: '10 min' },
  { minutes: 60, label: '1 hour' },
  { minutes: 1440, label: '1 day' }
]

const EXPIRY_KEY = 'expiryMinutes'

// useLayoutEffect warns during the build-time prerender; it only matters in the browser
const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

// Clip the active layer to one third: left, middle or right
const EXPIRY_CLIP = [
  'inset(0 66.667% 0 0 round 9999px)',
  'inset(0 33.333% 0 33.333% round 9999px)',
  'inset(0 0 0 66.667% round 9999px)'
]

// Remember the last choice on this device (falls back to 10 min)
const readExpiry = (): ExpiryMinutes => {
  try {
    const saved = Number(localStorage.getItem(EXPIRY_KEY))
    return saved === 60 || saved === 1440 ? saved : 10
  } catch {
    return 10
  }
}

export const DropForm: React.FC<{ incoming?: IncomingShare | null }> = ({ incoming }) => {
  const [content, setContent] = useState('')
  const [inputMethod, setInputMethod] = useState<InputMethod>('typed')
  // Start at the default so the first render matches the prerendered HTML,
  // then jump (without animating) to this device's saved choice.
  const [expiry, setExpiry] = useState<ExpiryMinutes>(10)
  const [expirySynced, setExpirySynced] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [returned, setReturned] = useState(false)
  const [result, setResult] = useState<{
    code: string
    content: string
    createdAt: number
    expiresAt: number
  } | null>(null)
  const { dropLink, updateLink } = useLinks()
  const submitRef = useRef<HTMLButtonElement>(null)

  // Shared in from another app or page: fill the box and put focus on Drop It,
  // so it's one tap (or Enter) away. The expiry stays the user's choice.
  useEffect(() => {
    if (!incoming) return
    setResult(null)
    setContent(incoming.content)
    setInputMethod(incoming.via)
    requestAnimationFrame(() => submitRef.current?.focus({ preventScroll: true }))
  }, [incoming])

  useBrowserLayoutEffect(() => {
    setExpiry(readExpiry())
    const frame = requestAnimationFrame(() => setExpirySynced(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const chooseExpiry = (minutes: ExpiryMinutes) => {
    setExpiry(minutes)
    try { localStorage.setItem(EXPIRY_KEY, String(minutes)) } catch { /* storage blocked */ }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || submitting) return

    if (content.length > 400) {
      toast.error('Content exceeds 400 character limit', {
        style: { background: '#fee2e2', borderColor: '#fca5a5' },
        icon: '✕'
      })
      return
    }

    setSubmitting(true)
    try {
      const link = await dropLink(content, inputMethod, expiry)
      setResult({
        code: link.id,
        content: link.content,
        createdAt: link.createdAt,
        expiresAt: link.expiresAt
      })
      setContent('')
      setInputMethod('typed')
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message, {
          style: { background: '#fee2e2', borderColor: '#fca5a5' },
          icon: '✕'
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (newContent: string) => {
    if (!result) return

    try {
      const updatedLink = await updateLink(result.code, newContent)
      if (updatedLink) {
        setResult({
          code: updatedLink.id,
          content: updatedLink.content,
          createdAt: updatedLink.createdAt,
          expiresAt: updatedLink.expiresAt
        })
        toast.success('Content updated successfully', {
          style: { background: '#dcfce7', borderColor: '#86efac' }
        })
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message, {
          style: { background: '#fee2e2', borderColor: '#fca5a5' },
          icon: '✕'
        })
      }
    }
  }

  if (result) {
    return (
      <DropResult
        code={result.code}
        content={result.content}
        createdAt={result.createdAt}
        expiresAt={result.expiresAt}
        onReset={() => { setResult(null); setReturned(true) }}
        onEdit={handleEdit}
      />
    )
  }

  return (
    // The card sits on a tray; the tray's lip below carries the privacy note
    <div className={`w-full rounded-2xl border border-gray-200 bg-[#EEF0F4] ${returned ? 'stagger-item' : ''}`}>
    <div className="card -m-px p-6">
      <h2 className="text-lg font-semibold mb-6 text-gray-900">Drop a Link or Message</h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <textarea
            className="input-field min-h-[120px] resize-none text-sm"
            placeholder="Paste a URL or type a message..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onPaste={() => setInputMethod('pasted')}
            onKeyDown={(e) => {
              // Cmd/Ctrl + Enter drops it
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e)
            }}
            maxLength={400}
            required
          />
          <div className="text-right mt-2 text-gray-500 text-xs">
            {content.length}/400 characters
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="text-sm text-gray-500" id="expiry-label">Expires after</span>
          <div
            role="radiogroup"
            aria-labelledby="expiry-label"
            className="relative grid grid-cols-3 rounded-full bg-gray-100 p-1"
          >
            {EXPIRY_OPTIONS.map(option => (
              <button
                key={option.minutes}
                type="button"
                role="radio"
                aria-checked={expiry === option.minutes}
                onClick={() => chooseExpiry(option.minutes)}
                className="relative w-16 rounded-full py-1.5 text-xs font-medium text-gray-500 transition-colors duration-150 hover:text-gray-700"
              >
                {option.label}
              </button>
            ))}
            {/* Active layer: white pill + dark labels, clipped to the selected third */}
            <div
              aria-hidden
              className="seg-active-layer pointer-events-none select-none absolute inset-1 grid grid-cols-3"
              style={{
                clipPath: EXPIRY_CLIP[EXPIRY_OPTIONS.findIndex(o => o.minutes === expiry)],
                ...(expirySynced ? {} : { transition: 'none' })
              }}
            >
              {EXPIRY_OPTIONS.map(option => (
                <span
                  key={option.minutes}
                  className="flex w-16 items-center justify-center rounded-full bg-white py-1.5 text-xs font-medium text-gray-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                >
                  {option.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <button
          ref={submitRef}
          type="submit"
          className="btn btn-primary w-full flex items-center justify-center text-sm"
          disabled={!content.trim() || submitting}
        >
          <Send className="h-4 w-4 mr-2 shrink-0" />
          Drop It
        </button>
      </form>

      <ActiveDrops showOnlyOwn />
    </div>
      <p className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs text-gray-500">
        <Lock className="h-3 w-3 shrink-0" />
        Deleted when it expires. No account, no history.
      </p>
    </div>
  )
}
