import React, { useState, useEffect } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { useLinks } from '../contexts/LinkContext'
import { RetrieveResult } from './RetrieveResult'
import { ActiveDrops } from './ActiveDrops'
import { toast } from 'sonner'
import { useAsyncAction } from '../hooks/useAsyncAction'

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
  const [shake, setShake] = useState(false)
  const { getLink } = useLinks()
  const { isPending, run } = useAsyncAction()

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode)
      handleSubmit(null, initialCode)
    }
  }, [initialCode])

  const triggerShake = () => {
    setShake(true)
    window.setTimeout(() => setShake(false), 400)
  }

  const handleSubmit = async (e: React.FormEvent | null, codeToUse?: string) => {
    if (e) e.preventDefault()
    setError('')

    const codeValue = codeToUse || code
    if (!codeValue.trim() || isPending) return

    await run(async () => {
      try {
        const link = await getLink(codeValue.trim().toLowerCase())
        if (!link) {
          setError('Code not found or link has expired')
          triggerShake()
          if ('vibrate' in navigator) {
            navigator.vibrate([10, 30, 10])
          }
          return
        }

        if ('vibrate' in navigator) {
          navigator.vibrate(5)
        }

        setResult({
          content: link.content,
          id: link.id,
          expiresAt: link.expiresAt,
        })
        setCode('')
      } catch (err) {
        if (err instanceof Error) {
          toast.error(err.message)
        }
        setError('Failed to retrieve content')
        triggerShake()
      }
    })
  }

  const handleReset = () => {
    setResult(null)
    setError('')
  }

  const handleCodeChange = (value: string) => {
    setCode(value.replace(/\D/g, '').slice(0, 4))
    if (error) setError('')
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
        <ActiveDrops showOnlyReceived />
      </>
    )
  }

  return (
    <>
      <div className="card w-full">
        <h2 className="text-heading mb-1">Retrieve a Link or Message</h2>
        <p className="text-caption mb-6">Enter the 4-digit code shared with you.</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="input-field text-center text-2xl font-semibold tracking-[0.2em] tabular-nums"
              placeholder="0000"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              maxLength={4}
              required
              disabled={isPending}
              data-shake={shake}
              data-error={!!error}
              aria-describedby={error ? 'code-error' : undefined}
              aria-invalid={!!error}
            />
            <div
              id="code-error"
              className="field-error"
              data-visible={!!error}
              role="alert"
            >
              {error || ' '}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full flex items-center justify-center"
            disabled={code.length !== 4 || isPending}
            data-loading={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            {isPending ? 'Retrieving…' : 'Retrieve'}
          </button>
        </form>
      </div>

      <ActiveDrops showOnlyReceived />
    </>
  )
}
