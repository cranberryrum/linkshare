import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { analytics as posthog } from '../lib/analytics'
import { getLinkMeta } from '../utils/linkMeta'

interface Link {
  id: string
  content: string
  expiresAt: number // in this device's clock (corrected for clock skew)
  createdAt: number
  creatorId: string
}

export type InputMethod = 'pasted' | 'typed'
export type RetrieveVia = 'qr_link' | 'typed'
export type ExpiryMinutes = 10 | 60 | 1440

interface LinkContextType {
  links: Record<string, Link>
  receivedLinks: Record<string, Link>
  dropLink: (content: string, inputMethod?: InputMethod, minutes?: ExpiryMinutes) => Promise<Link>
  getLink: (code: string, via?: RetrieveVia) => Promise<Link | null>
  deleteLink: (code: string) => Promise<void>
  updateLink: (code: string, content: string) => Promise<Link | null>
}

const LinkContext = createContext<LinkContextType | undefined>(undefined)

// Row shape returned by the database functions
interface LinkRow {
  code: string
  content: string
  created_at: string
  expires_at: string
}

interface RpcResult extends Partial<LinkRow> {
  status: string
  server_now?: string
  edit_token?: string
  links?: LinkRow[]
}

// Edit tokens live only on the creator's device: { [code]: token }
const TOKENS_KEY = 'linkTokens'

const readTokens = (): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem(TOKENS_KEY) || '{}')
  } catch {
    return {}
  }
}

const writeTokens = (tokens: Record<string, string>) => {
  try {
    localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens))
  } catch {
    // Storage blocked (private mode etc.): links still work, just not after a reload
  }
}

// The server owns time. Convert server timestamps into this device's clock so
// countdowns are right even when the device clock is wrong.
const toLocalTime = (iso: string, serverNow?: string) => {
  const skew = serverNow ? new Date(serverNow).getTime() - Date.now() : 0
  return new Date(iso).getTime() - skew
}

const toLink = (row: LinkRow, serverNow: string | undefined, creatorId: string): Link => ({
  id: row.code,
  content: row.content,
  expiresAt: toLocalTime(row.expires_at, serverNow),
  createdAt: toLocalTime(row.created_at, serverNow),
  creatorId
})

const callRpc = async (fn: string, args: Record<string, unknown>): Promise<RpcResult> => {
  const { data, error } = await supabase.rpc(fn, args)
  if (error || !data) {
    console.error(`Error calling ${fn}:`, error)
    throw new Error('Something went wrong. Please try again.')
  }
  return data as RpcResult
}

const CREATE_ERRORS: Record<string, string> = {
  empty: 'Please enter something to share',
  too_long: 'Content exceeds 400 character limit',
  bad_duration: 'Invalid expiry time',
  rate_limited: 'Too many drops from your network. Please wait a few minutes.',
  no_code_available: 'All codes are busy right now. Please try again in a minute.'
}

const LOOKUP_ERRORS: Record<string, string> = {
  expired: 'This link has expired. Ask for a new code.',
  rate_limited: 'Too many attempts from your network. Please wait a few minutes.'
}

export const LinkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [links, setLinks] = useState<Record<string, Link>>({})
  const [receivedLinks, setReceivedLinks] = useState<Record<string, Link>>({})
  const [creatorId] = useState(() => localStorage.getItem('creatorId') || crypto.randomUUID())

  useEffect(() => {
    localStorage.setItem('creatorId', creatorId)
    posthog.identify(creatorId)
  }, [creatorId])

  // Load this device's own active links using the tokens it holds
  useEffect(() => {
    const loadLinks = async () => {
      const tokens = readTokens()
      const codes = Object.keys(tokens)
      if (codes.length === 0) return

      try {
        const result = await callRpc('get_my_links', {
          p_codes: codes,
          p_tokens: codes.map(code => tokens[code])
        })
        const linksMap: Record<string, Link> = {}
        result.links?.forEach(row => {
          linksMap[row.code] = toLink(row, result.server_now, creatorId)
        })
        setLinks(linksMap)

        // Forget tokens for links that are gone
        writeTokens(Object.fromEntries(Object.keys(linksMap).map(code => [code, tokens[code]])))
      } catch (error) {
        console.error('Error loading links:', error)
      }
    }

    loadLinks()
  }, [creatorId])

  const dropLink = async (
    content: string,
    inputMethod: InputMethod = 'typed',
    minutes: ExpiryMinutes = 10
  ): Promise<Link> => {
    const activeLinks = Object.values(links).filter(link => link.expiresAt > Date.now())
    if (activeLinks.length >= 5) {
      throw new Error('Maximum limit of 5 active drops reached')
    }

    const result = await callRpc('create_link', { p_content: content, p_minutes: minutes })
    if (result.status !== 'ok' || !result.code || !result.edit_token) {
      throw new Error(CREATE_ERRORS[result.status] || 'Failed to create link')
    }

    const link = toLink(result as LinkRow, result.server_now, creatorId)
    writeTokens({ ...readTokens(), [link.id]: result.edit_token })
    setLinks(prev => ({ ...prev, [link.id]: link }))

    posthog.capture('link_created', {
      code: link.id,
      expires_at: result.expires_at,
      expiry_minutes: minutes,
      input_method: inputMethod,
      active_drops: Object.keys(links).length + 1,
      ...getLinkMeta(content)
    })

    return link
  }

  const updateLink = async (code: string, content: string): Promise<Link | null> => {
    const token = readTokens()[code]
    if (!token || !links[code]) {
      return null
    }

    const result = await callRpc('update_link', { p_code: code, p_token: token, p_content: content })
    if (result.status !== 'ok') {
      throw new Error(CREATE_ERRORS[result.status] || 'This link can no longer be edited')
    }

    const updatedLink = toLink(result as LinkRow, result.server_now, creatorId)
    setLinks(prev => ({ ...prev, [code]: updatedLink }))

    posthog.capture('link_updated', {
      code,
      ...getLinkMeta(content)
    })

    return updatedLink
  }

  // Returns null when the code doesn't exist; throws with a friendly message
  // when it expired or the network is rate limited.
  const getLink = useCallback(async (code: string, via: RetrieveVia = 'typed'): Promise<Link | null> => {
    const result = await callRpc('get_link', { p_code: code })

    if (result.status !== 'ok') {
      posthog.capture('link_retrieval_failed', { code, reason: result.status, via })
      if (LOOKUP_ERRORS[result.status]) {
        throw new Error(LOOKUP_ERRORS[result.status])
      }
      return null
    }

    const isOwn = code in readTokens()
    const link = toLink(result as LinkRow, result.server_now, isOwn ? creatorId : '')

    if (!isOwn) {
      setReceivedLinks(prev => ({ ...prev, [code]: link }))
    }
    posthog.capture('link_retrieved', {
      code,
      is_own: isOwn,
      via,
      seconds_since_created: Math.max(0, Math.round((Date.now() - link.createdAt) / 1000)),
      ...getLinkMeta(link.content)
    })

    return link
  }, [creatorId])

  const deleteLink = async (code: string): Promise<void> => {
    const tokens = readTokens()
    const token = tokens[code]
    if (!token) {
      throw new Error('You can only delete your own links')
    }

    const result = await callRpc('delete_link', { p_code: code, p_token: token })
    if (result.status !== 'ok') {
      throw new Error('Failed to delete link')
    }

    delete tokens[code]
    writeTokens(tokens)
    setLinks(prev => {
      const newLinks = { ...prev }
      delete newLinks[code]
      return newLinks
    })

    posthog.capture('link_deleted', { code })
  }

  return (
    <LinkContext.Provider value={{
      links,
      receivedLinks,
      dropLink,
      getLink,
      deleteLink,
      updateLink
    }}>
      {children}
    </LinkContext.Provider>
  )
}

export const useLinks = () => {
  const context = useContext(LinkContext)
  if (context === undefined) {
    throw new Error('useLinks must be used within a LinkProvider')
  }
  return context
}
