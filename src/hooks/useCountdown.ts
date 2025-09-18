import { useState, useEffect } from 'react'

interface CountdownResult {
  minutes: number
  seconds: number
  isExpired: boolean
}

export const useCountdown = (expiresAt: number): CountdownResult => {
  const calculateTimeLeft = (): CountdownResult => {
    const timeLeft = expiresAt - Date.now()
    
    if (timeLeft <= 0) {
      return { minutes: 0, seconds: 0, isExpired: true }
    }
    
    const minutes = Math.floor(timeLeft / 1000 / 60)
    const seconds = Math.floor((timeLeft / 1000) % 60)
    
    return { minutes, seconds, isExpired: false }
  }

  const [timeLeft, setTimeLeft] = useState<CountdownResult>(calculateTimeLeft())

  useEffect(() => {
    if (timeLeft.isExpired) return

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft()
      setTimeLeft(newTimeLeft)
      
      if (newTimeLeft.isExpired) {
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [expiresAt, timeLeft.isExpired])

  return timeLeft
}