import React from 'react'
import { Copy, ExternalLink } from 'lucide-react'
import { useCountdown } from '../hooks/useCountdown'
import { toast } from 'sonner'

interface RetrieveResultProps {
  content: string
  code: string
  expiresAt: number
  onReset: () => void
}

export const RetrieveResult: React.FC<RetrieveResultProps> = ({
  content,
  code,
  expiresAt,
  onReset,
}) => {
  const { minutes, seconds, isExpired, isUrgent } = useCountdown(expiresAt)

  const isUrl = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?$/.test(content)

  const copyContent = () => {
    navigator.clipboard.writeText(content).then(() => {
      if ('vibrate' in navigator) {
        navigator.vibrate(5)
      }
      toast.success('Content copied')
    }).catch(() => {
      toast.error('Failed to copy content')
    })
  }

  const openUrl = () => {
    let url = content
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url
    }
    window.open(url, '_blank')
  }

  const renderContent = () => {
    if (isUrl) {
      return (
        <a
          href={/^https?:\/\//i.test(content) ? content : `https://${content}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-app-blue hover:underline content-break"
        >
          {content}
        </a>
      )
    }
    return content
  }

  return (
    <div className="card w-full animate-success">
      <h2 className="text-heading mb-6">Retrieved Content</h2>

      <div className="mb-6">
        <div className="card-inset mb-4">
          <div className="flex items-start gap-2 min-w-0">
            <div className="content-break content-scroll flex-1 pr-1 text-body">
              {renderContent()}
            </div>
            <button
              onPointerDown={copyContent}
              className="btn-icon shrink-0"
              disabled={isExpired}
              aria-label="Copy content"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isExpired ? (
          <p className="text-app-error font-medium text-caption text-center" role="status">
            This content has expired
          </p>
        ) : (
          <div className="flex justify-center">
            <span className="countdown-pill" data-urgent={isUrgent}>
              Expires in {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
            </span>
          </div>
        )}
      </div>

      {!isExpired && (
        <div className="info-banner">
          <p className="text-caption">
            <span className="font-medium text-app-blue">Share this content</span>
            {' — '}others can access it with code{' '}
            <span className="font-semibold tabular-nums">{code}</span>
          </p>
        </div>
      )}

      {isUrl && (
        <button
          onPointerDown={openUrl}
          className="btn btn-primary w-full flex items-center justify-center mb-2"
          disabled={isExpired}
        >
          <ExternalLink className="h-4 w-4 mr-2 shrink-0" />
          Open Link
        </button>
      )}

      <button onPointerDown={onReset} className="btn btn-secondary w-full">
        Retrieve Another
      </button>
    </div>
  )
}
