// Privacy-safe facts about shared content for analytics.
// Never returns the content itself, a full URL, a path or a query string —
// only the website's domain (e.g. "docs.google.com") when there is a link.

// Links inside text must start with http(s):// or www. so words like
// "notes.pdf" aren't mistaken for a website.
const URL_PATTERN = /(?:https?:\/\/|www\.)(?:[\w-]+\.)+[a-z]{2,}(?::\d+)?(?:\/\S*)?/i
const WHOLE_URL_PATTERN = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?$/i

const toDomain = (raw: string): string | null => {
  try {
    const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
    return new URL(withScheme).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return null
  }
}

export interface LinkMeta {
  content_type: 'url' | 'text'
  contains_url: boolean
  url_domain: string | null
  content_length: number
  length_bucket: '1-20' | '21-50' | '51-100' | '101-200' | '201-399' | '400 (limit)'
  at_char_limit: boolean
  line_count: number
}

export const getLinkMeta = (content: string): LinkMeta => {
  const trimmed = content.trim()
  const isUrl = WHOLE_URL_PATTERN.test(trimmed)
  const match = isUrl ? trimmed : trimmed.match(URL_PATTERN)?.[0]
  const length = content.length

  const length_bucket: LinkMeta['length_bucket'] =
    length >= 400 ? '400 (limit)'
      : length > 200 ? '201-399'
      : length > 100 ? '101-200'
      : length > 50 ? '51-100'
      : length > 20 ? '21-50'
      : '1-20'

  return {
    content_type: isUrl ? 'url' : 'text',
    contains_url: Boolean(match),
    url_domain: match ? toDomain(match) : null,
    content_length: length,
    length_bucket,
    at_char_limit: length >= 400,
    line_count: content.split('\n').length
  }
}
