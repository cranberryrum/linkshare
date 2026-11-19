import React, { useEffect, useRef, useState } from 'react'
import { ArrowUp, Check, X } from 'lucide-react'
import { usePresence } from '../hooks/usePresence'
import { analytics as posthog } from '../lib/analytics'
import { supabase } from '../lib/supabase'
import { buildAnswerContext } from '../lib/answerContext'

// One-tap question shown as a centred popup over the result screens.
// Answers go to our own Supabase table (quick_answers). A device is asked
// until it answers; closing it (✕, Skip, Esc or a tap outside) hides
// questions for a week.

type QuestionId = 'drop_audience' | 'receive_sender'

const QUESTIONS: Record<QuestionId, { prompt: string; choices: { id: string; label: string }[] }> = {
  drop_audience: {
    prompt: "Who's this for?",
    choices: [
      { id: 'myself', label: 'My other device' },
      { id: 'someone_else', label: 'Someone else' },
      { id: 'group', label: 'A group' }
    ]
  },
  receive_sender: {
    prompt: 'Who sent you this?',
    choices: [
      { id: 'me', label: 'Me' },
      { id: 'someone_i_know', label: 'Someone I know' },
      { id: 'presenter', label: 'A presenter / screen' }
    ]
  }
}

const DISMISS_KEY = 'qq:dismissedAt'
const WEEK = 7 * 24 * 60 * 60 * 1000

const storage = {
  get: (k: string) => { try { return localStorage.getItem(k) } catch { return null } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v) } catch { /* storage blocked */ } }
}

const shouldShow = (question: QuestionId) => {
  if (storage.get(`qq:${question}`)) return false
  const dismissedAt = Number(storage.get(DISMISS_KEY) || 0)
  return Date.now() - dismissedAt > WEEK
}

type Step = 'ask' | 'note' | 'thanks'

interface QuickQuestionProps {
  question: QuestionId
  /** Open this long after the result appears, if nothing triggers it sooner */
  delayMs: number
  /** Becomes true when the person has done the main thing (e.g. copied or
   *  opened what they received): open soon after that instead */
  triggerNow?: boolean
  /** Sender's code, repeated in the popup so it's never hidden while they read it out */
  code?: string
}

export const QuickQuestion: React.FC<QuickQuestionProps> = ({ question, delayMs, triggerNow, code }) => {
  const [eligible] = useState(() => shouldShow(question))
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('ask')
  const [selected, setSelected] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const answerId = useRef<string | null>(null)
  const noteInput = useRef<HTMLInputElement>(null)
  const firstChoice = useRef<HTMLButtonElement>(null)
  const config = QUESTIONS[question]
  const { isMounted, isClosing, onExitEnd } = usePresence(open)

  // Open after the delay, or shortly after the main action, whichever is first
  useEffect(() => {
    if (!eligible) return
    const t = setTimeout(() => setOpen(true), triggerNow ? 500 : delayMs)
    return () => clearTimeout(t)
  }, [eligible, delayMs, triggerNow])

  // It's a popup, so opening it means it was seen
  const logged = useRef(false)
  useEffect(() => {
    if (!open || logged.current) return
    logged.current = true
    posthog.capture('quick_question_shown', { question })
  }, [open, question])

  // While open: Escape closes, page behind doesn't scroll, focus starts on the answers
  useEffect(() => {
    if (!open) return
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close('escape') }
    window.addEventListener('keydown', onKey)
    requestAnimationFrame(() => firstChoice.current?.focus({ preventScroll: true }))
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (step === 'note' && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      noteInput.current?.focus()
    }
  }, [step])

  // After "thanks", close on its own
  useEffect(() => {
    if (step !== 'thanks') return
    const t = setTimeout(() => setOpen(false), 1400)
    return () => clearTimeout(t)
  }, [step])

  // Closing before answering counts as a dismissal; after answering it's just
  // closing. Read through a ref so the Escape handler always sees the latest.
  const answered = useRef(false)
  answered.current = selected !== null
  function close(method: 'close_button' | 'skip' | 'escape' | 'backdrop') {
    if (!answered.current) {
      storage.set(DISMISS_KEY, String(Date.now()))
      posthog.capture('quick_question_dismissed', { question, step, method })
    }
    setOpen(false)
  }

  if (!isMounted) return null

  const answer = async (choice: string) => {
    if (selected) return
    setSelected(choice)
    storage.set(`qq:${question}`, choice)
    posthog.capture('quick_question_answered', { question, answer: choice })
    // Let the selected state register before swapping to the note step
    setTimeout(() => setStep('note'), 220)
    const args = { p_question: question, p_answer: choice }
    const context = await buildAnswerContext()
    let { data, error } = await supabase.rpc('submit_quick_answer', { ...args, p_context: context })
    // Database not migrated yet (older function without p_context): still save the answer
    if (error) ({ data, error } = await supabase.rpc('submit_quick_answer', args))
    if (data?.id) answerId.current = data.id
  }

  const sendNote = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const text = note.trim()
    setStep('thanks')
    if (!text) return
    posthog.capture('quick_question_note_added', { question })
    if (answerId.current) {
      await supabase.rpc('add_quick_note', { p_id: answerId.current, p_note: text })
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
      onAnimationEnd={onExitEnd}
      onClick={e => { if (e.target === e.currentTarget) close('backdrop') }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="qq-title"
        className={`relative w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 ${isClosing ? 'animate-scale-out' : 'animate-scale-in'}`}
      >
        <button
          onClick={() => close('close_button')}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition-colors hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>

        {code && (
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">
            Your code
            <span className="font-mono text-sm font-bold tracking-[0.2em]">{code}</span>
          </p>
        )}

        {step === 'ask' && (
          <div className="tab-swap">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Quick one</p>
            <h2 id="qq-title" className="mt-1 pr-8 text-lg font-semibold text-gray-900">
              {config.prompt}
            </h2>
            <div className="mt-4 flex flex-col gap-2" role="group" aria-labelledby="qq-title">
              {config.choices.map((choice, i) => (
                <button
                  key={choice.id}
                  ref={i === 0 ? firstChoice : undefined}
                  onClick={() => answer(choice.id)}
                  aria-pressed={selected === choice.id}
                  className={`qq-chip btn flex w-full items-center justify-between text-left text-sm ${
                    selected === choice.id ? 'qq-chip-selected' : 'btn-secondary'
                  }`}
                >
                  {choice.label}
                  {selected === choice.id && <Check className="h-4 w-4 shrink-0" />}
                </button>
              ))}
            </div>
            <button
              onClick={() => close('skip')}
              className="mt-3 w-full rounded-lg py-1.5 text-sm text-gray-400 transition-colors hover:text-gray-700"
            >
              Skip
            </button>
          </div>
        )}

        {step === 'note' && (
          <form className="tab-swap" onSubmit={sendNote}>
            <h2 id="qq-title" className="pr-8 text-lg font-semibold text-gray-900">
              Thanks! What would make Linkshare better?
            </h2>
            <div className="relative mt-4">
              <input
                ref={noteInput}
                value={note}
                onChange={e => setNote(e.target.value)}
                maxLength={280}
                placeholder="Optional, e.g. a longer timer"
                className="input-field py-2.5 pl-3.5 pr-12 text-sm"
                aria-label="What would make Linkshare better?"
              />
              <button
                type="submit"
                aria-label="Send"
                disabled={!note.trim()}
                className="btn btn-primary absolute right-1.5 top-1/2 -mt-4 flex h-8 w-8 items-center justify-center p-0"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setStep('thanks')}
              className="mt-3 w-full rounded-lg py-1.5 text-sm text-gray-400 transition-colors hover:text-gray-700"
            >
              Skip
            </button>
          </form>
        )}

        {step === 'thanks' && (
          <p className="tab-swap flex items-center gap-2 py-2 text-base font-semibold text-gray-900" aria-live="polite">
            <Check className="h-5 w-5 text-blue-500" />
            Thanks, that helps.
          </p>
        )}
      </div>
    </div>
  )
}
