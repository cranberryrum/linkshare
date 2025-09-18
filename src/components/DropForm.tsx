import React, { useState } from 'react'
import { Send, PlusCircle } from 'lucide-react'
import { useLinks } from '../contexts/LinkContext'
import { DropResult } from './DropResult'
import { ActiveDrops } from './ActiveDrops'
import { toast } from 'sonner'

export const DropForm: React.FC = () => {
  const [content, setContent] = useState('')
  const [result, setResult] = useState<{
    code: string
    content: string
    expiresAt: number
  } | null>(null)
  const { dropLink, updateLink } = useLinks()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) return

    if (content.length > 400) {
      toast.error('Content exceeds 400 character limit', {
        style: { background: '#fee2e2', borderColor: '#fca5a5' },
        icon: '✕'
      })
      return
    }

    try {
      const link = await dropLink(content)
      setResult({
        code: link.id,
        content: link.content,
        expiresAt: link.expiresAt
      })
      setContent('')
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message, {
          style: { background: '#fee2e2', borderColor: '#fca5a5' },
          icon: '✕'
        })
      }
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
      />
    )
  }

  return (
    <div className="card p-6 w-full animate-scale-in">
      <h2 className="text-xl font-semibold mb-4">Drop a Link or Message</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <textarea
            className="input-field min-h-[100px] resize-none"
            placeholder="Paste a URL or type a message..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={400}
            required
          />
          <div className="text-right mt-1 text-app-text-secondary text-sm">
            {content.length}/400 characters
          </div>
        </div>
        
        <button
          type="submit"
          className={`btn btn-primary w-full flex items-center justify-center ${
            content.trim() ? '' : 'opacity-50 cursor-not-allowed'
          }`}
          disabled={!content.trim()}
        >
          <Send className="h-5 w-5 mr-2 shrink-0" />
          Drop It
        </button>
      </form>

      <div className="mt-8">
        <ActiveDrops showOnlyOwn />
      </div>
    </div>
  )
}