import React, { useState } from 'react'
import { QrCode, Trash2 } from 'lucide-react'
import { useCountdown } from '../hooks/useCountdown'
import { QRModal } from './QRModal'

interface DropCardProps {
  id: string
  content: string
  expiresAt: number
  onDelete: () => void
  showDelete?: boolean
  index?: number
}

export const DropCard: React.FC<DropCardProps> = ({
  id,
  content,
  expiresAt,
  onDelete,
  showDelete = false,
  index = 0,
}) => {
  const { minutes, seconds, isExpired, isUrgent } = useCountdown(expiresAt)
  const [showQR, setShowQR] = useState(false)
  const [exiting, setExiting] = useState(false)

  if (isExpired && !exiting) return null

  const handleDelete = () => {
    setExiting(true)
    window.setTimeout(onDelete, 180)
  }

  return (
    <>
      <div
        className="drop-card stagger-item"
        data-exiting={exiting}
        style={{ animationDelay: `${index * 40}ms` }}
      >
        <div className="flex justify-between items-start gap-2 mb-2 min-w-0">
          <span className="font-semibold text-app-blue tabular-nums tracking-wide shrink-0">{id}</span>
          <div className="flex items-center gap-1 shrink-0">
            {showDelete && (
              <>
                <button
                  onPointerDown={() => setShowQR(true)}
                  className="btn-icon"
                  aria-label={`Show QR code for ${id}`}
                >
                  <QrCode className="h-4 w-4" />
                </button>
                <button
                  onPointerDown={handleDelete}
                  className="btn-icon btn-icon-danger"
                  aria-label={`Delete drop ${id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
        <p className="text-body text-app-text-secondary truncate mb-2 min-w-0">{content}</p>
        <p className="text-caption tabular-nums" data-urgent={isUrgent}>
          Expires in {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
        </p>
      </div>

      <QRModal
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        code={id}
      />
    </>
  )
}
