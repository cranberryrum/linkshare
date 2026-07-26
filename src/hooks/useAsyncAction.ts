import { useState, useCallback, useRef } from 'react'

export const useAsyncAction = () => {
  const [isPending, setIsPending] = useState(false)
  const pendingRef = useRef(false)

  const run = useCallback(async <T,>(action: () => Promise<T>): Promise<T | undefined> => {
    if (pendingRef.current) return undefined

    pendingRef.current = true
    setIsPending(true)

    try {
      return await action()
    } finally {
      pendingRef.current = false
      setIsPending(false)
    }
  }, [])

  return { isPending, run }
}
