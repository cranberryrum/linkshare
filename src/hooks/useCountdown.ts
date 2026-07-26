import { useState, useEffect } from 'react'

interface CountdownResult {
  minutes: number
  seconds: number
  isExpired: boolean
  isUrgent: boolean
}

export const useCountdown = (expiresAt: number): CountdownResult => {
  const calculateTimeLeft = (): CountdownResult => {
    const timeLeft = expiresAt - Date.now()

    if (timeLeft <= 0) {
      return { minutes: 0, seconds: 0, isExpired: true, isUrgent: false }
    }

    const minutes = Math.floor(timeLeft / 1000 / 60)
    const seconds = Math.floor((timeLeft / 1000) % 60)

    return {
      minutes,
      seconds,
      isExpired: false,
      isUrgent: timeLeft <= 60_000,
    }
  }

  const [timeLeft, setTimeLeft] = useState<CountdownResult>(calculateTimeLeft())

  useEffect(() => {
    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [expiresAt])

  return timeLeft
}
