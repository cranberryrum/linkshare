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

  if (isExpired) return null

  return (
    <>
      <div className="bg-white/90 backdrop-blur-sm rounded-app-button p-4 border border-app-border mb-3">
        <div className="flex justify-between items-start mb-2">
          <span className="font-medium text-app-blue">{id}</span>
          <div className="flex items-center space-x-2">
            {showDelete && (
              <>
                <button
                  onClick={() => setShowQR(true)}
                  className="text-gray-400 hover:text-app-blue transition-colors"
                >
                  <QrCode className="h-4 w-4" />
                </button>
                <button
                  onClick={onDelete}
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
      
      <QRModal 
        isOpen={showQR} 
        onClose={() => setShowQR(false)} 
        code={id} 
      />
    </>
  )
}