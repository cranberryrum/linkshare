import React, { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { Send, Lock } from 'lucide-react'
import { useLinks, InputMethod, Expiry, ExpiryMinutes } from '../contexts/LinkContext'
import { DropResult } from './DropResult'
import { ActiveDrops } from './ActiveDrops'
import { toast } from 'sonner'
import type { IncomingShare } from '../utils/incomingShare'

const EXPIRY_OPTIONS: { value: Expiry; label: string }[] = [
  { value: 10, label: '10 min' },
  { value: 60, label: '1 hour' },
  { value: 1440, label: '1 day' },
  { value: 'once', label: '1 view' }
]

const EXPIRY_KEY = 'expiryMinutes'

// useLayoutEffect warns during the build-time prerender; it only matters in the browser
const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

// Clip the active layer to one quarter
const EXPIRY_CLIP = [
  'inset(0 75% 0 0 round 9999px)',
  'inset(0 50% 0 25% round 9999px)',
  'inset(0 25% 0 50% round 9999px)',
  'inset(0 0 0 75% round 9999px)'
]

// Remember the last time choice on this device (falls back to 10 min).
// "1 view" is never remembered, so a drop is never one-view by surprise.
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
  const [expiry, setExpiry] = useState<Expiry>(10)
  const [expirySynced, setExpirySynced] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [returned, setReturned] = useState(false)
  const [result, setResult] = useState<{
    code: string
    content: string
    createdAt: number
    expiresAt: number
    oneView: boolean
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

  const chooseExpiry = (value: Expiry) => {
    setExpiry(value)
    if (value === 'once') return
    try { localStorage.setItem(EXPIRY_KEY, String(value satisfies ExpiryMinutes)) } catch { /* storage blocked */ }
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
        expiresAt: link.expiresAt,
        oneView: link.oneView
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
          expiresAt: updatedLink.expiresAt,
          oneView: result.oneView
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
        oneView={result.oneView}
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

        {/* Label above the picker on phones (four options need the width), beside it on larger screens */}
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <span className="text-sm text-gray-500" id="expiry-label">Expires after</span>
          <div
            role="radiogroup"
            aria-labelledby="expiry-label"
            className="relative grid grid-cols-4 rounded-full bg-gray-100 p-1"
          >
            {EXPIRY_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={expiry === option.value}
                onClick={() => chooseExpiry(option.value)}
                className="relative rounded-full py-1.5 text-xs font-medium text-gray-500 transition-colors duration-150 hover:text-gray-700 sm:w-16"
              >
                {option.label}
              </button>
            ))}
            {/* Active layer: white pill + dark labels, clipped to the selected quarter */}
            <div
              aria-hidden
              className="seg-active-layer pointer-events-none select-none absolute inset-1 grid grid-cols-4"
              style={{
                clipPath: EXPIRY_CLIP[EXPIRY_OPTIONS.findIndex(o => o.value === expiry)],
                ...(expirySynced ? {} : { transition: 'none' })
              }}
            >
              {EXPIRY_OPTIONS.map(option => (
                <span
                  key={option.value}
                  className="flex items-center justify-center rounded-full bg-white py-1.5 text-xs font-medium text-gray-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)] sm:w-16"
                >
                  {option.label}
                </span>
              ))}
            </div>
          </div>
        </div>
        {expiry === 'once' && (
          <p className="tab-swap -mt-2 mb-4 text-xs text-gray-500">
            Deleted as soon as it’s opened, or after a day if nobody opens it.
          </p>
        )}

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
