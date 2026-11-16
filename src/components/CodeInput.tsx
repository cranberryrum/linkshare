import React, { forwardRef, useImperativeHandle, useRef } from 'react'

export interface CodeInputHandle {
  focus: () => void
  shake: () => void
}

interface CodeInputProps {
  value: string
  onChange: (value: string) => void
  onComplete: (value: string) => void
  invalid?: boolean
  disabled?: boolean
  autoFocus?: boolean
}

const LENGTH = 4
const digitsOnly = (s: string) => s.replace(/\D/g, '')

// Four boxes that behave like one field: type, paste ("Code: 3040" works too),
// Backspace and arrow keys move between boxes, and the 4th digit submits.
export const CodeInput = forwardRef<CodeInputHandle, CodeInputProps>(
  ({ value, onChange, onComplete, invalid, disabled, autoFocus }, ref) => {
    const inputs = useRef<(HTMLInputElement | null)[]>([])
    const group = useRef<HTMLDivElement>(null)

    const focusAt = (i: number) => {
      const el = inputs.current[Math.max(0, Math.min(LENGTH - 1, i))]
      el?.focus()
      el?.select()
    }

    useImperativeHandle(ref, () => ({
      focus: () => focusAt(Math.min(value.length, LENGTH - 1)),
      shake: () => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
        group.current?.animate(
          [
            { transform: 'translateX(0)' },
            { transform: 'translateX(-5px)' },
            { transform: 'translateX(5px)' },
            { transform: 'translateX(-3px)' },
            { transform: 'translateX(3px)' },
            { transform: 'translateX(0)' }
          ],
          { duration: 300, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }
        )
      }
    }))

    // Write digits starting at a box; submit once all four are filled
    const fillFrom = (start: number, incoming: string) => {
      const chars = value.padEnd(LENGTH, ' ').split('')
      const digits = digitsOnly(incoming).slice(0, LENGTH - start)
      digits.split('').forEach((d, k) => { chars[start + k] = d })
      const next = chars.join('').replace(/\s+$/, '').replace(/\s/g, '')
      onChange(next)
      if (next.length === LENGTH) {
        inputs.current[LENGTH - 1]?.blur()
        onComplete(next)
      } else {
        focusAt(start + digits.length)
      }
    }

    const handleKeyDown = (i: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        e.preventDefault()
        if (value[i]) {
          onChange(value.slice(0, i) + value.slice(i + 1))
          focusAt(i)
        } else if (i > 0) {
          onChange(value.slice(0, i - 1) + value.slice(i))
          focusAt(i - 1)
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        focusAt(i - 1)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        focusAt(i + 1)
      }
    }

    return (
      <div ref={group} className="flex justify-center gap-2 sm:gap-3" role="group" aria-label="4-digit code">
        {Array.from({ length: LENGTH }, (_, i) => (
          <input
            key={i}
            ref={el => { inputs.current[i] = el }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            aria-label={`Digit ${i + 1}`}
            maxLength={LENGTH}
            autoFocus={autoFocus && i === 0}
            disabled={disabled}
            value={value[i] ?? ''}
            onFocus={e => e.target.select()}
            onChange={e => fillFrom(i, e.target.value)}
            onPaste={e => {
              e.preventDefault()
              fillFrom(0, e.clipboardData.getData('text'))
            }}
            onKeyDown={handleKeyDown(i)}
            className={`code-box h-16 w-14 sm:h-[72px] sm:w-16 rounded-xl border bg-white text-center text-3xl font-semibold
              text-gray-900 outline-none caret-transparent
              ${invalid ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-500/10' : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'}`}
          />
        ))}
      </div>
    )
  }
)
CodeInput.displayName = 'CodeInput'
