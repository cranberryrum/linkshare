import React, { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import { useLinks } from '../contexts/LinkContext'
import { RetrieveResult } from './RetrieveResult'
import { ActiveDrops } from './ActiveDrops'

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
  const { getLink } = useLinks()
  const inputRef = useRef<HTMLInputElement>(null)

  const shakeInput = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    inputRef.current?.animate(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-4px)' },
        { transform: 'translateX(4px)' },
        { transform: 'translateX(-3px)' },
        { transform: 'translateX(3px)' },
        { transform: 'translateX(0)' }
      ],
      { duration: 300, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }
    )
  }

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
      const link = await getLink(codeValue.trim().toLowerCase(), codeToUse ? 'qr_link' : 'typed')
      if (!link) {
        setError("That code doesn't exist. Check the digits and try again.")
        shakeInput()
        return
      }

      setResult({
        content: link.content,
        id: link.id,
        expiresAt: link.expiresAt
      })
      setCode('')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to retrieve content')
      shakeInput()
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
      <div className="card p-6 w-full">
        <h2 className="text-lg font-semibold mb-6 text-gray-900">Retrieve a Link or Message</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              ref={inputRef}
              type="text"
              className="input-field text-sm"
              placeholder="Enter the 4-digit code (e.g., 1234)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={4}
              required
            />
            {error && (
              <p className="mt-2 text-red-500 text-xs animate-fade-in-fast">{error}</p>
            )}
          </div>
          
          <button
            type="submit"
            className="btn btn-primary w-full flex items-center justify-center text-sm"
            disabled={!code.trim()}
          >
            <Search className="h-4 w-4 mr-2" />
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