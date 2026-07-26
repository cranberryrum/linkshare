import React, { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { useLinks } from '../contexts/LinkContext'
import { DropResult } from './DropResult'
import { ActiveDrops } from './ActiveDrops'
import { toast } from 'sonner'
import { useAsyncAction } from '../hooks/useAsyncAction'

export const DropForm: React.FC = () => {
  const [content, setContent] = useState('')
  const [result, setResult] = useState<{
    code: string
    content: string
    expiresAt: number
  } | null>(null)
  const { dropLink, updateLink } = useLinks()
  const { isPending, run } = useAsyncAction()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim() || isPending) return

    if (content.length > 400) {
      toast.error('Content exceeds 400 character limit')
      return
    }

    await run(async () => {
      try {
        const link = await dropLink(content)
        setResult({
          code: link.id,
          content: link.content,
          expiresAt: link.expiresAt,
        })
        setContent('')
        if ('vibrate' in navigator) {
          navigator.vibrate(5)
        }
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message)
        }
      }
    })
  }

  const handleEdit = async (newContent: string) => {
    if (!result) return

    await run(async () => {
      try {
        const updatedLink = await updateLink(result.code, newContent)
        if (updatedLink) {
          setResult({
            code: updatedLink.id,
            content: updatedLink.content,
            expiresAt: updatedLink.expiresAt,
          })
          toast.success('Content updated')
        }
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message)
        }
      }
    })
  }

  const handleReset = () => {
    setResult(null)
  }

  if (result) {
    return (
      <DropResult
        code={result.code}
        content={result.content}
        expiresAt={result.expiresAt}
        onReset={handleReset}
        onEdit={handleEdit}
        isSaving={isPending}
      />
    )
  }

  return (
    <>
      <div className="card w-full">
        <h2 className="text-heading mb-1">Drop a Link or Message</h2>
        <p className="text-caption mb-6">Share up to 400 characters. Expires in 10 minutes.</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <textarea
              className="input-field min-h-[120px] max-h-[240px] resize-none content-break"
              placeholder="Paste a URL or type a message..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={400}
              required
              disabled={isPending}
              aria-describedby="char-count"
            />
            <div id="char-count" className="text-right mt-2 text-caption tabular-nums">
              {content.length}/400
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full flex items-center justify-center"
            disabled={!content.trim() || isPending}
            data-loading={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 shrink-0 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2 shrink-0" />
            )}
            {isPending ? 'Dropping…' : 'Drop It'}
          </button>
        </form>
      </div>

      <ActiveDrops showOnlyOwn />
    </>
  )
}
