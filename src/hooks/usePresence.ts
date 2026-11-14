import { useState, useEffect, type AnimationEvent } from 'react'

// Keeps an element mounted while its exit animation plays.
// Render while `isMounted`, apply exit classes while `isClosing`, and call
// `onExitEnd` from the root's onAnimationEnd to unmount.
export const usePresence = (isOpen: boolean) => {
  const [isMounted, setIsMounted] = useState(isOpen)

  useEffect(() => {
    if (isOpen) setIsMounted(true)
  }, [isOpen])

  const onExitEnd = (e: AnimationEvent) => {
    // Child animations bubble up; only the root's own animation should unmount
    if (e.target === e.currentTarget && !isOpen) setIsMounted(false)
  }

  return { isMounted, isClosing: isMounted && !isOpen, onExitEnd }
}
