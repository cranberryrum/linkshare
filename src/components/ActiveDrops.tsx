import React from 'react'
import { useLinks } from '../contexts/LinkContext'
import { DropCard } from './DropCard'
import { toast } from 'sonner'

interface ActiveDropsProps {
  showOnlyOwn?: boolean
  showOnlyReceived?: boolean
}

export const ActiveDrops: React.FC<ActiveDropsProps> = ({ 
  showOnlyOwn = false, 
  showOnlyReceived = false 
}) => {
  const { links, receivedLinks, deleteLink } = useLinks()

  const linksToShow = showOnlyReceived 
    ? Object.entries(receivedLinks)
        .filter(([_, link]) => link.expiresAt > Date.now())
        .sort((a, b) => b[1].createdAt - a[1].createdAt)
    : Object.entries(links)
        .filter(([_, link]) => {
          if (showOnlyOwn && link.creatorId !== localStorage.getItem('creatorId')) {
            return false
          }
          return link.expiresAt > Date.now()
        })
        .sort((a, b) => b[1].createdAt - a[1].createdAt)

  if (linksToShow.length === 0) {
    return null
  }

  const handleDelete = async (code: string) => {
    try {
      await deleteLink(code)
      toast('Drop deleted', {
        style: { background: '#fee2e2', borderColor: '#fca5a5' },
        icon: '🗑️'
      })
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message, {
          style: { background: '#fee2e2', borderColor: '#fca5a5' },
          icon: '✕'
        })
      }
    }
  }

  return (
    <div className="animate-fade-in">
      <h3 className="text-lg font-semibold mb-3">
        {showOnlyReceived ? 'Recently Received' : 'Active Drops'}
      </h3>
      {linksToShow.map(([code, link]) => (
        <DropCard
          key={code}
          id={code}
          content={link.content}
          expiresAt={link.expiresAt}
          onDelete={() => handleDelete(code)}
          showDelete={!showOnlyReceived}
        />
      ))}
    </div>
  )
}