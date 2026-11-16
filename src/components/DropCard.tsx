import React, { useState, useEffect } from 'react'
import { QrCode, Trash2 } from 'lucide-react'
import { useCountdown } from '../hooks/useCountdown'
import { QRModal } from './QRModal'
import posthog from 'posthog-js'

interface DropCardProps {
  id: string
  content: string
  expiresAt: number
  onDelete: () => Promise<boolean>
  showDelete?: boolean
}

export const DropCard: React.FC<DropCardProps> = ({
  id,
  content,
  expiresAt,
  onDelete,
  showDelete = false
}) => {
  const { minutes, seconds, isExpired } = useCountdown(expiresAt)
  const [showQR, setShowQR] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [isGone, setIsGone] = useState(isExpired)

  // Fade + shrink (150ms), then collapse the row (200ms) before removing it
  const playExit = () => {
    setIsLeaving(true)
    return new Promise<void>(resolve => setTimeout(resolve, 350))
  }

  useEffect(() => {
    if (isExpired && !isGone) playExit().then(() => setIsGone(true))
  }, [isExpired, isGone])

  const handleDelete = async () => {
    await playExit()
    const deleted = await onDelete()
    if (!deleted) setIsLeaving(false)
  }

  if (isGone) return null

  return (
    <>
      <div className={`drop-card-row ${isLeaving ? 'is-leaving' : ''}`}>
        <div>
          <div className="drop-card bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-gray-200 mb-3">
            <div className="flex justify-between items-start mb-2">
              <span className="font-medium text-app-blue">{id}</span>
              <div className="flex items-center space-x-2">
                {showDelete && (
                  <>
                    <button
                      onClick={() => {
                        setShowQR(true)
                        posthog.capture('qr_opened', { code: id })
                      }}
                      className="text-gray-400 hover:text-app-blue transition-colors"
                    >
                      <QrCode className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isLeaving}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
            <p className="text-sm text-app-text-secondary truncate mb-1">{content}</p>
            <p className="text-xs text-app-text-secondary">
              Expires in {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
            </p>
          </div>
        </div>
      </div>

      <QRModal 
        isOpen={showQR} 
        onClose={() => setShowQR(false)} 
        code={id} 
      />
    </>
  )
}