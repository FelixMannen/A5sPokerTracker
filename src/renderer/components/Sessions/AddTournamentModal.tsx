import { useState } from 'react'
import type { NewPendingTournament, RegistrationTime } from '../../types'
import { todayISO } from '../../utils/format'
import { ModalShell, Field, inputClass } from './ModalShell'
import TournamentNameInput from '../TournamentNameInput'

interface Props {
  onAdd: (data: Omit<NewPendingTournament, 'play_session_id'>) => Promise<void>
  onClose: () => void
  tournamentNames: string[]
}

const TOURNAMENT_TYPES = ['PKO', 'Freezeout', 'Satellite', 'Bounty', 'Mystery Bounty', 'Hyper', 'Turbo', 'Other']
const REG_TIMES: RegistrationTime[] = ['Early', 'Medium', 'Late']

// Adds a tournament you're *currently playing* — no cashout yet (entered on Finish)
export default function AddTournamentModal({ onAdd, onClose, tournamentNames }: Props) {
  const [name, setName] = useState('')
  const [date, setDate] = useState(todayISO())
  const [buyIn, setBuyIn] = useState('')
  const [type, setType] = useState('')
  const [regTime, setRegTime] = useState<RegistrationTime | ''>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const bi = Number(buyIn)
    if (!buyIn || bi < 0) {
      setError('Buy-in must be 0 or more')
      return
    }

    setError('')
    setSubmitting(true)
    try {
      await onAdd({
        tournament_name: name.trim() || null,
        date,
        buy_in: bi,
        type: type || null,
        registration_time: (regTime as RegistrationTime) || null
      })
      onClose()
    } catch {
      setError('Failed to add. Try again.')
      setSubmitting(false)
    }
  }

  return (
    <ModalShell title="Add Tournament" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Tournament Name">
          <TournamentNameInput
            value={name}
            onChange={setName}
            names={tournamentNames}
            inputClass={inputClass}
            autoFocus
            placeholder="e.g. Sunday Million"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Buy-in (€)">
            <input
              type="number"
              min="0"
              step="0.01"
              value={buyIn}
              onChange={(e) => setBuyIn(e.target.value)}
              placeholder="0.00"
              className={inputClass}
              required
            />
          </Field>
          <Field label="Date">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
              required
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Type (optional)">
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
              <option value="">—</option>
              {TOURNAMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Registration">
            <select
              value={regTime}
              onChange={(e) => setRegTime(e.target.value as RegistrationTime | '')}
              className={inputClass}
            >
              <option value="">—</option>
              {REG_TIMES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
        </div>

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
            {submitting ? 'Adding…' : 'Add to Session'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}
