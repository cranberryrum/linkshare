import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { generateCode, generateExpirationTime } from '../utils/codeGenerator'
import posthog from 'posthog-js'

interface Link {
  id: string
  content: string
  expiresAt: number
  createdAt: number
  creatorId: string
}

interface LinkContextType {
  links: Record<string, Link>
  receivedLinks: Record<string, Link>
  dropLink: (content: string) => Promise<Link>
  getLink: (code: string) => Promise<Link | null>
  deleteLink: (code: string) => Promise<void>
  updateLink: (code: string, content: string) => Promise<Link | null>
}

const LinkContext = createContext<LinkContextType | undefined>(undefined)

export const LinkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [links, setLinks] = useState<Record<string, Link>>({})
  const [receivedLinks, setReceivedLinks] = useState<Record<string, Link>>({})
  const [creatorId] = useState(() => localStorage.getItem('creatorId') || crypto.randomUUID())

  useEffect(() => {
    localStorage.setItem('creatorId', creatorId)
    posthog.identify(creatorId)
  }, [creatorId])

  useEffect(() => {
    const loadLinks = async () => {
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .eq('creator_id', creatorId)
        .gt('expires_at', new Date().toISOString())

      if (error) {
        console.error('Error loading links:', error)
        return
      }

      const linksMap: Record<string, Link> = {}
      data.forEach(link => {
        linksMap[link.id] = {
          id: link.id,
          content: link.content,
          expiresAt: new Date(link.expires_at).getTime(),
          createdAt: new Date(link.created_at).getTime(),
          creatorId: link.creator_id
        }
      })
      setLinks(linksMap)
    }

    loadLinks()
  }, [creatorId])

  const dropLink = async (content: string): Promise<Link> => {
    const activeLinks = Object.values(links).filter(link => link.expiresAt > Date.now())
    if (activeLinks.length >= 5) {
      throw new Error('Maximum limit of 5 active drops reached')
    }

    let code = generateCode()
    while (links[code]) {
      code = generateCode()
    }

    const expiresAt = generateExpirationTime()
    const { data, error } = await supabase
      .from('links')
      .insert([{
        id: code,
        content,
        expires_at: new Date(expiresAt).toISOString(),
        creator_id: creatorId
      }])
      .select()
      .single()

    if (error || !data) {
      console.error('Error creating link:', error)
      throw new Error('Failed to create link')
    }

    const link: Link = {
      id: data.id,
      content: data.content,
      expiresAt: new Date(data.expires_at).getTime(),
      createdAt: new Date(data.created_at).getTime(),
      creatorId: data.creator_id
    }

    setLinks(prev => ({ ...prev, [code]: link }))
    
    posthog.capture('link_created', {
      code,
      content_length: content.length,
      expires_at: new Date(expiresAt).toISOString()
    })

    return link
  }

  const updateLink = async (code: string, content: string): Promise<Link | null> => {
    const link = links[code]
    if (!link || link.expiresAt < Date.now() || link.creatorId !== creatorId) {
      return null
    }

    const { data, error } = await supabase
      .from('links')
      .update({ content })
      .eq('id', code)
      .eq('creator_id', creatorId)
      .select()
      .single()

    if (error || !data) {
      console.error('Error updating link:', error)
      throw new Error('Failed to update link')
    }

    const updatedLink: Link = {
      id: data.id,
      content: data.content,
      expiresAt: new Date(data.expires_at).getTime(),
      createdAt: new Date(data.created_at).getTime(),
      creatorId: data.creator_id
    }

    setLinks(prev => ({ ...prev, [code]: updatedLink }))
    
    posthog.capture('link_updated', {
      code,
      content_length: content.length
    })

    return updatedLink
  }

  const getLink = async (code: string): Promise<Link | null> => {
    const { data, error } = await supabase
      .from('links')
      .select('*')
      .eq('id', code)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !data) {
      posthog.capture('link_retrieval_failed', { code })
      return null
    }

    const link: Link = {
      id: data.id,
      content: data.content,
      expiresAt: new Date(data.expires_at).getTime(),
      createdAt: new Date(data.created_at).getTime(),
      creatorId: data.creator_id
    }

    if (data.creator_id !== creatorId) {
      setReceivedLinks(prev => ({ ...prev, [code]: link }))
      posthog.capture('link_retrieved', { code, is_own: false })
    } else {
      posthog.capture('link_retrieved', { code, is_own: true })
    }

    return link
  }

  const deleteLink = async (code: string): Promise<void> => {
    const link = links[code]
    if (!link || link.creatorId !== creatorId) {
      throw new Error('You can only delete your own links')
    }

    const { error } = await supabase
      .from('links')
      .delete()
      .eq('id', code)
      .eq('creator_id', creatorId)

    if (error) {
      console.error('Error deleting link:', error)
      throw new Error('Failed to delete link')
    }

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