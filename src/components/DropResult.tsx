import React, { useState, useRef } from 'react'
import { Copy, Send, PlusCircle, Pen } from 'lucide-react'
import QRCode from 'react-qr-code'
import { useCountdown } from '../hooks/useCountdown'
import { toast } from 'sonner'

interface DropResultProps {
  code: string
  content: string
  expiresAt: number
  onReset: () => void
  onEdit: (content: string) => void
}

export const DropResult: React.FC<DropResultProps> = ({
  code,
  content,
  expiresAt,
  onReset,
  onEdit
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(content)
  const { minutes, seconds, isExpired } = useCountdown(expiresAt)
  const codeRef = useRef<HTMLDivElement>(null)

  const copyCode = () => {
    navigator.clipboard.writeText(code).then(() => {
      if ('vibrate' in navigator) {
        navigator.vibrate(5)
      }
      toast.success('Code copied to clipboard', {
        style: { background: '#dcfce7', borderColor: '#86efac' },
        icon: '✓'
      })
      
      if (codeRef.current) {
        codeRef.current.classList.add('bg-green-50')
        setTimeout(() => {
          if (codeRef.current) {
            codeRef.current.classList.remove('bg-green-50')
          }
        }, 500)
      }
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
    toast.success('Content updated successfully', {
      style: { background: '#dcfce7', borderColor: '#86efac' }
    })
  }

  const qrValue = `${window.location.origin}/?code=${code}`

  return (
    <div className="card p-6 w-full animate-scale-in">
      <div className="flex items-center justify-between mb-6">
        <div 
          ref={codeRef}
          className="text-5xl font-bold text-app-blue tracking-wider py-2 rounded-app-button transition-colors duration-200"
        >
          {code}
        </div>
        <button
          onClick={copyCode}
          className="btn btn-secondary flex items-center justify-center px-4 py-2 h-10"
          disabled={isExpired}
        >
          <Copy className="h-5 w-5 shrink-0" />
        </button>
      </div>

      <p className="text-app-text-secondary mb-4">
        Open linkshare.live on another device and enter this code to receive your content
      </p>

      {!isExpired && (
        <p className="text-center text-app-text-secondary mb-4">
          Expires in {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
        </p>
      )}

      <div className="mb-6">
        <QRCode
          value={qrValue}
          size={96}
          style={{ height: '96px', width: '96px', margin: '0 auto' }}
          viewBox="0 0 96 96"
        />
      </div>

      {isEditing ? (
        <div className="mb-4">
          <textarea
            className="input-field min-h-[100px] resize-none mb-2"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            maxLength={400}
          />
          <div className="text-right mb-2 text-app-text-secondary text-sm">
            {editContent.length}/400 characters
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="btn btn-primary flex-1"
            >
              Save
            </button>
            <button
              onClick={() => {
                setIsEditing(false)
                setEditContent(content)
              }}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <div className="bg-gray-50/80 backdrop-blur-sm p-4 rounded-app-button border border-app-border">
            <div className="flex items-start justify-between gap-2">
              <div className="break-words flex-grow overflow-auto max-h-[200px] pr-2">
                {content}
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="shrink-0 text-gray-500 hover:text-app-blue transition-colors ml-2"
                disabled={isExpired}
              >
                <Pen className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={onReset}
        className="btn btn-secondary w-full mt-3 flex items-center justify-center"
      >
        <PlusCircle className="h-5 w-5 mr-2 shrink-0" />
        New Drop
      </button>
    </div>
  )
}