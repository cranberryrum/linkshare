import React from 'react'
import QRCode from 'react-qr-code'
import { Modal, ModalClose } from './Modal'

interface QRModalProps {
  isOpen: boolean
  onClose: () => void
  code: string
}

export const QRModal: React.FC<QRModalProps> = ({ isOpen, onClose, code }) => {
  const qrValue = `${window.location.origin}/?code=${code}`

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-xs"
      ariaLabel={`QR code for ${code}`}
    >
      <ModalClose onClose={onClose} />

      <div className="flex flex-col items-center pt-2">
        <h3 className="text-heading mb-1">Scan to receive</h3>
        <p className="text-caption mb-6 tabular-nums">Code {code}</p>
        <div className="qr-frame">
          <QRCode
            value={qrValue}
            size={200}
            style={{ height: '200px', width: '200px' }}
            viewBox="0 0 200 200"
          />
        </div>
      </div>
    </Modal>
  )
}
