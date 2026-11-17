import React, { useEffect, useRef, useState } from 'react'
import { ArrowUp, Check, X } from 'lucide-react'
import posthog from 'posthog-js'
import { supabase } from '../lib/supabase'

// One-tap question shown under the content on the result screens.
// Answers go to our own Supabase table (quick_answers). Each device sees each
// question once; closing it hides questions for a week.

type QuestionId = 'drop_audience' | 'receive_sender'

const QUESTIONS: Record<QuestionId, { prompt: string; choices: { id: string; label: string }[] }> = {
  drop_audience: {
    prompt: "Quick one: who's this for?",
    choices: [
      { id: 'myself', label: 'My other device' },
      { id: 'someone_else', label: 'Someone else' },
      { id: 'group', label: 'A group' }
    ]
  },
  receive_sender: {
    prompt: 'Quick one: who sent you this?',
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
  /** position in the parent's stagger sequence */
  index: number
}

export const QuickQuestion: React.FC<QuickQuestionProps> = ({ question, index }) => {
  const [visible] = useState(() => shouldShow(question))
  const [step, setStep] = useState<Step>('ask')
  const [selected, setSelected] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [closing, setClosing] = useState(false)
  const [gone, setGone] = useState(false)
  const answerId = useRef<string | null>(null)
  const noteInput = useRef<HTMLInputElement>(null)
  const config = QUESTIONS[question]

  // After "thanks", fold the section away
  useEffect(() => {
    if (step !== 'thanks') return
    const fold = setTimeout(() => setClosing(true), 1800)
    return () => clearTimeout(fold)
  }, [step])

  // Remove it once folded. The timer covers reduced motion, where the fold
  // doesn't animate and no transitionend ever fires.
  useEffect(() => {
    if (!closing) return
    const remove = setTimeout(() => setGone(true), 400)
    return () => clearTimeout(remove)
  }, [closing])

  useEffect(() => {
    if (step === 'note' && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      noteInput.current?.focus()
    }
  }, [step])

  if (!visible || gone) return null

  const answer = async (choice: string) => {
    if (selected) return
    setSelected(choice)
    storage.set(`qq:${question}`, choice)
    posthog.capture('quick_question_answered', { question, answer: choice })
    // Let the chip's selected state register before swapping to the note step
    setTimeout(() => setStep('note'), 220)
    const { data } = await supabase.rpc('submit_quick_answer', { p_question: question, p_answer: choice })
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

  const dismiss = () => {
    storage.set(DISMISS_KEY, String(Date.now()))
    posthog.capture('quick_question_dismissed', { question, step })
    setClosing(true)
  }

  return (
    <div
      className={`qq-fold stagger-item ${closing ? 'is-closing' : ''}`}
      style={{ '--i': index } as React.CSSProperties}
    >
      <div>
        <div className="mt-5 border-t border-gray-100 pt-4">
          {step === 'ask' && (
            <div className="tab-swap">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-gray-500">{config.prompt}</p>
                <button
                  onClick={dismiss}
                  aria-label="Hide this question"
                  className="-mr-1 rounded-md p-1 text-gray-400 transition-colors hover:text-gray-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2" role="group" aria-label={config.prompt}>
                {config.choices.map(choice => (
                  <button
                    key={choice.id}
                    onClick={() => answer(choice.id)}
                    aria-pressed={selected === choice.id}
                    className={`qq-chip btn rounded-full px-3.5 py-1.5 text-sm ${
                      selected === choice.id ? 'qq-chip-selected' : 'btn-secondary'
                    }`}
                  >
                    {selected === choice.id && <Check className="mr-1 inline h-3.5 w-3.5 -mt-0.5" />}
                    {choice.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'note' && (
            <form className="tab-swap" onSubmit={sendNote}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-gray-500">Thanks! What would make Linkshare better?</p>
                <button
                  type="button"
                  onClick={() => setStep('thanks')}
                  className="text-xs text-gray-400 transition-colors hover:text-gray-700"
                >
                  Skip
                </button>
              </div>
              <div className="relative mt-2.5">
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
                  className="btn btn-primary absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center p-0"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}

          {step === 'thanks' && (
            <p className="tab-swap flex items-center gap-1.5 text-xs font-medium text-gray-500" aria-live="polite">
              <Check className="h-3.5 w-3.5 text-blue-500" />
              Thanks, that helps.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
