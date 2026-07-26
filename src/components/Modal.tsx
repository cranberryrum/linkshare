import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
  ariaLabelledBy?: string
  ariaLabel?: string
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className = '',
  ariaLabelledBy,
  ariaLabel,
}) => {
  const [mounted, setMounted] = useState(isOpen)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      setClosing(false)
      return
    }

    if (!mounted) return

    setClosing(true)
    const timer = window.setTimeout(() => {
      setMounted(false)
      setClosing(false)
    }, 180)

    return () => clearTimeout(timer)
  }, [isOpen, mounted])

  useEffect(() => {
    if (!mounted) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [mounted, onClose])

  if (!mounted) return null

  return (
    <div
      className="modal-overlay"
      data-closing={closing}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
      aria-label={ariaLabel}
    >
      <div
        className={`modal-content ${className}`}
        data-closing={closing}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

interface ModalCloseProps {
  onClose: () => void
}

export const ModalClose: React.FC<ModalCloseProps> = ({ onClose }) => (
  <button
    onClick={onClose}
    className="btn-icon absolute right-3 top-3"
    aria-label="Close"
  >
    <X className="h-5 w-5" />
  </button>
)
