import { useState, useEffect } from 'react'

interface CountdownResult {
  minutes: number
  seconds: number
  msLeft: number
  isExpired: boolean
  /** "9:58" under an hour, "23h 59m" for longer links */
  label: string
}

export const formatRemaining = (ms: number): string => {
  if (ms <= 0) return '0:00'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) return `${hours}h ${minutes.toString().padStart(2, '0')}m`
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const calculate = (expiresAt: number): CountdownResult => {
  const msLeft = Math.max(0, expiresAt - Date.now())
  const totalSeconds = Math.floor(msLeft / 1000)
  return {
    minutes: Math.floor(totalSeconds / 60),
    seconds: totalSeconds % 60,
    msLeft,
    isExpired: msLeft <= 0,
    label: formatRemaining(msLeft)
  }
}

export const useCountdown = (expiresAt: number): CountdownResult => {
  const [timeLeft, setTimeLeft] = useState<CountdownResult>(() => calculate(expiresAt))

  useEffect(() => {
    setTimeLeft(calculate(expiresAt))
    const timer = setInterval(() => {
      const next = calculate(expiresAt)
      setTimeLeft(next)
      if (next.isExpired) clearInterval(timer)
    }, 1000)
    return () => clearInterval(timer)
  }, [expiresAt])

  return timeLeft
}
