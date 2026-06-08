import { useState, useEffect, useRef } from 'react'
import { ModalShell, Field, inputClass } from './ModalShell'

interface Props {
  onConfirm: (title: string | null, notes: string | null) => Promise<void>
  onClose: () => void
}

// Final step when ending a session: name it (optional) and add notes, then save
export default function FinishSessionModal({ onConfirm, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const titleRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await onConfirm(title.trim() || null, notes.trim() || null)
      onClose()
    } catch {
      setError('Failed to save session. Try again.')
      setSubmitting(false)
    }
  }

  return (
    <ModalShell title="Finish Session" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Session Title">
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Friday night grind"
            className={inputClass}
            autoComplete="off"
          />
        </Field>

        <Field label="Notes (optional)">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did it go? Anything to remember…"
            rows={4}
            className={`${inputClass} resize-none`}
          />
        </Field>

        {error && <p className="rounded-lg bg-red-950/50 px-3 py-2 text-xs text-red-400">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-gray-400 transition hover:border-white/20 hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Save Session'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}
