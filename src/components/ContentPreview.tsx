import React from 'react'
import { Globe } from 'lucide-react'

const WHOLE_URL = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?$/i

export const isUrlContent = (content: string) => WHOLE_URL.test(content.trim())

export const toHref = (content: string) => {
  const trimmed = content.trim()
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

const splitUrl = (content: string) => {
  try {
    const url = new URL(toHref(content))
    const rest = `${url.pathname === '/' ? '' : url.pathname}${url.search}${url.hash}`
    return { domain: url.hostname.replace(/^www\./, ''), rest }
  } catch {
    return { domain: content, rest: '' }
  }
}

interface ContentPreviewProps {
  content: string
  onLinkClick?: () => void
}

// Links show as "domain + shortened path" so they're recognisable at a glance
// and long URLs don't break the layout. Plain text keeps its line breaks.
// No favicon service is called, so nothing about the link leaves the page.
export const ContentPreview: React.FC<ContentPreviewProps> = ({ content, onLinkClick }) => {
  if (!isUrlContent(content)) {
    return (
      <p className="whitespace-pre-wrap break-words text-sm text-gray-900 max-h-[200px] overflow-auto">
        {content}
      </p>
    )
  }

  const { domain, rest } = splitUrl(content)
  return (
    <a
      href={toHref(content)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onLinkClick}
      className="group flex items-center gap-3 min-w-0"
      title={content}
    >
      <span className="shrink-0 h-9 w-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500">
        <Globe className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-gray-900 truncate group-hover:underline">{domain}</span>
        {rest && <span className="block text-xs text-gray-500 truncate">{rest}</span>}
      </span>
    </a>
  )
}
