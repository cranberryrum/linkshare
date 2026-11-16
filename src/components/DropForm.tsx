import React, { useState } from 'react'
import { Send } from 'lucide-react'
import { useLinks, InputMethod, ExpiryMinutes } from '../contexts/LinkContext'
import { DropResult } from './DropResult'
import { ActiveDrops } from './ActiveDrops'
import { toast } from 'sonner'

const EXPIRY_OPTIONS: { minutes: ExpiryMinutes; label: string }[] = [
  { minutes: 10, label: '10 min' },
  { minutes: 60, label: '1 hour' },
  { minutes: 1440, label: '1 day' }
]

const EXPIRY_KEY = 'expiryMinutes'

// Remember the last choice on this device (falls back to 10 min)
const readExpiry = (): ExpiryMinutes => {
  try {
    const saved = Number(localStorage.getItem(EXPIRY_KEY))
    return saved === 60 || saved === 1440 ? saved : 10
  } catch {
    return 10
  }
}

export const DropForm: React.FC = () => {
  const [content, setContent] = useState('')
  const [inputMethod, setInputMethod] = useState<InputMethod>('typed')
  const [expiry, setExpiry] = useState<ExpiryMinutes>(readExpiry)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{
    code: string
    content: string
    createdAt: number
    expiresAt: number
  } | null>(null)
  const { dropLink, updateLink } = useLinks()

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
        onReset={() => setResult(null)}
        onEdit={handleEdit}
      />
    )
  }

  return (
    <div className="card p-6 w-full">
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
            className="flex rounded-full bg-gray-100 p-1"
          >
            {EXPIRY_OPTIONS.map(option => {
              const selected = expiry === option.minutes
              return (
                <button
                  key={option.minutes}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => chooseExpiry(option.minutes)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                    selected ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full flex items-center justify-center text-sm"
          disabled={!content.trim() || submitting}
        >
          <Send className="h-4 w-4 mr-2 shrink-0" />
          Drop It
        </button>
      </form>

      <div className="mt-8">
        <ActiveDrops showOnlyOwn />
      </div>
    </div>
  )
}
