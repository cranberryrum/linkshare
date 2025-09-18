import React, { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { useLinks } from '../contexts/LinkContext'
import { RetrieveResult } from './RetrieveResult'
import { ActiveDrops } from './ActiveDrops'
import { toast } from 'sonner'

interface RetrieveFormProps {
  initialCode?: string | null
}

export const RetrieveForm: React.FC<RetrieveFormProps> = ({ initialCode }) => {
  const [code, setCode] = useState('')
  const [result, setResult] = useState<{
    content: string
    id: string
    expiresAt: number
  } | null>(null)
  const [error, setError] = useState('')
  const { getLink, receivedLinks } = useLinks()

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode)
      handleSubmit(null, initialCode)
    }
  }, [initialCode])

  const handleSubmit = async (e: React.FormEvent | null, codeToUse?: string) => {
    if (e) e.preventDefault()
    setError('')
    
    const codeValue = codeToUse || code
    if (!codeValue.trim()) return

    try {
      const link = await getLink(codeValue.trim().toLowerCase())
      if (!link) {
        setError('Code not found or link has expired')
        return
      }

      setResult({
        content: link.content,
        id: link.id,
        expiresAt: link.expiresAt
      })
      setCode('')
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message, {
          style: { background: '#fee2e2', borderColor: '#fca5a5' },
          icon: '✕'
        })
      }
      setError('Failed to retrieve content')
    }
  }

  const handleReset = () => {
    setResult(null)
    setError('')
  }

  if (result) {
    return (
      <>
        <RetrieveResult
          content={result.content}
          code={result.id}
          expiresAt={result.expiresAt}
          onReset={handleReset}
        />
        <div className="mt-8">
          <ActiveDrops showOnlyReceived />
        </div>
      </>
    )
  }

  return (
    <>
      <div className="card p-6 w-full animate-scale-in">
        <h2 className="text-xl font-semibold mb-4">Retrieve a Link or Message</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              className="input-field"
              placeholder="Enter the 4-digit code (e.g., 1234)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={4}
              required
            />
            {error && (
              <p className="mt-2 text-red-500 text-sm">{error}</p>
            )}
          </div>
          
          <button
            type="submit"
            className="btn btn-primary w-full flex items-center justify-center"
            disabled={!code.trim()}
          >
            <Search className="h-5 w-5 mr-2" />
            Retrieve
          </button>
        </form>
      </div>

      <div className="mt-8">
        <ActiveDrops showOnlyReceived />
      </div>
    </>
  )
}