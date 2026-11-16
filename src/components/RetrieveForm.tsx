import React, { useState, useEffect, useRef } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { useLinks } from '../contexts/LinkContext'
import { RetrieveResult } from './RetrieveResult'
import { ActiveDrops } from './ActiveDrops'
import { CodeInput, CodeInputHandle } from './CodeInput'

interface RetrieveFormProps {
  initialCode?: string | null
}

export const RetrieveForm: React.FC<RetrieveFormProps> = ({ initialCode }) => {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    content: string
    id: string
    expiresAt: number
  } | null>(null)
  const [error, setError] = useState('')
  const [returned, setReturned] = useState(false)
  const { getLink } = useLinks()
  const codeInput = useRef<CodeInputHandle>(null)

  useEffect(() => {
    if (initialCode) {
      const digits = initialCode.replace(/\D/g, '').slice(0, 4)
      setCode(digits)
      lookup(digits, 'qr_link')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode])

  const lookup = async (codeValue: string, via: 'qr_link' | 'typed' = 'typed') => {
    if (codeValue.length !== 4 || loading) return
    setError('')
    setLoading(true)

    const fail = (message: string) => {
      setError(message)
      setCode('')
      codeInput.current?.shake()
      // Let the shake start, then put the cursor back in the first box
      setTimeout(() => codeInput.current?.focus(), 0)
    }

    try {
      const link = await getLink(codeValue, via)
      if (!link) {
        fail("That code doesn't exist. Check the digits and try again.")
        return
      }
      setResult({ content: link.content, id: link.id, expiresAt: link.expiresAt })
      setCode('')
    } catch (err) {
      fail(err instanceof Error ? err.message : 'Failed to retrieve content')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setError('')
    setReturned(true)
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
      <div className={`card p-6 w-full ${returned ? 'stagger-item' : ''}`}>
        <h2 className="text-lg font-semibold mb-1 text-gray-900">Enter the code</h2>
        <p className="text-sm text-gray-500 mb-6">The 4 digits shown on the other device.</p>

        <form onSubmit={e => { e.preventDefault(); lookup(code) }}>
          <CodeInput
            ref={codeInput}
            value={code}
            onChange={v => { setCode(v); if (error) setError('') }}
            onComplete={v => lookup(v)}
            invalid={Boolean(error)}
            disabled={loading}
            autoFocus={!initialCode && window.matchMedia('(hover: hover) and (pointer: fine)').matches}
          />
          <p className="mt-3 min-h-[1rem] text-center text-xs text-red-500" aria-live="polite">{error}</p>

          <button
            type="submit"
            className="btn btn-primary w-full flex items-center justify-center text-sm mt-3"
            disabled={code.length !== 4 || loading}
          >
            {loading
              ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              : <Search className="h-4 w-4 mr-2" />}
            {loading ? 'Opening…' : 'Retrieve'}
          </button>
        </form>
      </div>

      <div className="mt-8">
        <ActiveDrops showOnlyReceived />
      </div>
    </>
  )
}
