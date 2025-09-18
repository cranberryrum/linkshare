import React from 'react'
import { X } from 'lucide-react'
import QRCode from 'react-qr-code'

interface QRModalProps {
  isOpen: boolean
  onClose: () => void
  code: string
}

export const QRModal: React.FC<QRModalProps> = ({ isOpen, onClose, code }) => {
  if (!isOpen) return null

  const qrValue = `${window.location.origin}/?code=${code}`

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-app max-w-xs w-full p-6 relative animate-scale-in">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="flex flex-col items-center">
          <h3 className="text-lg font-semibold mb-4">QR Code for {code}</h3>
          <QRCode
            value={qrValue}
            size={200}
            style={{ height: '200px', width: '200px' }}
            viewBox="0 0 200 200"
          />
        </div>
      </div>
    </div>
  )
}