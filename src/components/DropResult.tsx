import React, { useState, useRef } from 'react'
import { Copy, PlusCircle, Pen, Loader2 } from 'lucide-react'
import QRCode from 'react-qr-code'
import { useCountdown } from '../hooks/useCountdown'
import { toast } from 'sonner'

interface DropResultProps {
  code: string
  content: string
  expiresAt: number
  onReset: () => void
  onEdit: (content: string) => void
  isSaving?: boolean
}

export const DropResult: React.FC<DropResultProps> = ({
  code,
  content,
  expiresAt,
  onReset,
  onEdit,
  isSaving = false,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(content)
  const [copied, setCopied] = useState(false)
  const { minutes, seconds, isExpired, isUrgent } = useCountdown(expiresAt)
  const codeRef = useRef<HTMLDivElement>(null)

  const copyCode = () => {
    navigator.clipboard.writeText(code).then(() => {
      if ('vibrate' in navigator) {
        navigator.vibrate(5)
      }
      toast.success('Code copied')
      setCopied(true)
      window.setTimeout(() => setCopied(false), 400)
    }).catch(() => {
      toast.error('Failed to copy code')
    })
  }

  const handleSave = () => {
    if (editContent.length > 400) {
      toast.error('Content exceeds 400 character limit')
      return
    }

    onEdit(editContent)
    setIsEditing(false)
  }

  const toggleEdit = () => {
    if (isEditing) {
      setEditContent(content)
    }
    setIsEditing(!isEditing)
  }

  const qrValue = `${window.location.origin}/?code=${code}`

  return (
    <div className="card w-full animate-success">
      <div className="flex items-center justify-center gap-2 mb-2">
        <div
          ref={codeRef}
          className="text-display py-1 px-2 rounded-app-button transition-colors duration-300"
          data-copied={copied}
        >
          {code}
        </div>
        <button
          onPointerDown={copyCode}
          className="btn-icon"
          disabled={isExpired}
          aria-label="Copy code"
        >
          <Copy className="h-4 w-4 shrink-0" />
        </button>
      </div>

      <p className="text-caption mb-6 text-center">
        Open linkshare.live on another device and enter this code
      </p>

      {!isExpired && (
        <div className="flex justify-center mb-6">
          <span className="countdown-pill" data-urgent={isUrgent}>
            Expires in {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
          </span>
        </div>
      )}

      <div className="mb-6">
        <div className="qr-frame">
          <QRCode
            value={qrValue}
            size={96}
            style={{ height: '96px', width: '96px' }}
            viewBox="0 0 96 96"
          />
        </div>
      </div>

      <div className="content-switch mb-6">
        <div className="content-pane" aria-hidden={!isEditing}>
          <div className="input-shell mb-4">
            <textarea
              className="input-field min-h-[100px] max-h-[240px] resize-none content-break"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              maxLength={400}
              autoFocus={isEditing}
              disabled={isSaving || !isEditing}
              tabIndex={isEditing ? 0 : -1}
              aria-describedby="edit-char-count"
            />
            <div id="edit-char-count" className="char-count">
              {editContent.length}/400
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="btn btn-primary flex-1"
              disabled={isSaving || !isEditing}
              data-loading={isSaving}
              tabIndex={isEditing ? 0 : -1}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Save'
              )}
            </button>
            <button
              onClick={toggleEdit}
              className="btn btn-secondary flex-1"
              disabled={isSaving || !isEditing}
              tabIndex={isEditing ? 0 : -1}
            >
              Cancel
            </button>
          </div>
        </div>
        <div className="content-pane" aria-hidden={isEditing}>
          <div className="card-inset">
            <div className="flex items-start gap-2 min-w-0">
              <div className="content-break content-scroll flex-1 pr-1 text-body">
                {content}
              </div>
              <button
                onPointerDown={() => !isExpired && setIsEditing(true)}
                className="btn-icon shrink-0"
                disabled={isExpired}
                aria-label="Edit content"
                tabIndex={isEditing ? -1 : 0}
              >
                <Pen className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <button
        onPointerDown={onReset}
        className="btn btn-secondary w-full flex items-center justify-center"
      >
        <PlusCircle className="h-4 w-4 mr-2 shrink-0" />
        New Drop
      </button>
    </div>
  )
}
