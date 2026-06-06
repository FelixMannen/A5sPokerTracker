import { useState, useEffect, useRef } from 'react'
import type { NewSession, RegistrationTime } from '../../types'
import { todayISO } from '../../utils/format'
import { useCurrency } from '../../context/CurrencyContext'

interface Props {
  onSubmit: (data: NewSession) => Promise<void>
  onClose: () => void
}

const TOURNAMENT_TYPES = ['PKO', 'Freezeout', 'Satellite', 'Bounty', 'Mystery Bounty', 'Hyper', 'Turbo', 'Other']
const REG_TIMES: RegistrationTime[] = ['Early', 'Medium', 'Late']

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">
        {label}
      </label>
      {children}
    </div>
  )
}

const inputClass =
  'w-full rounded-lg bg-[#1a1a1a] border border-white/10 px-3 py-2.5 text-sm text-gray-100 placeholder-gray-600 outline-none transition focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30'

export default function LogTournamentModal({ onSubmit, onClose }: Props) {
  const { format } = useCurrency()
  const [name, setName] = useState('')
  const [date, setDate] = useState(todayISO())
  const [buyIn, setBuyIn] = useState('')
  const [cashout, setCashout] = useState('')
  const [type, setType] = useState('')
  const [regTime, setRegTime] = useState<RegistrationTime | ''>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    firstInputRef.current?.focus()
  }, [])

  // close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const profit = buyIn && cashout ? Number(cashout) - Number(buyIn) : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const bi = Number(buyIn)
    const co = Number(cashout)
    if (!buyIn || bi < 0) { setError('Buy-in must be 0 or more'); return }
    if (!cashout && cashout !== '0') { setError('Enter cashout (0 if busted)'); return }
    if (co < 0) { setError('Cashout must be 0 or more'); return }

    setError('')
    setSubmitting(true)
    try {
      await onSubmit({
        tournament_name: name.trim() || null,
        date,
        buy_in: bi,
        cashout: co,
        type: type || null,
        registration_time: (regTime as RegistrationTime) || null
      })
      onClose()
    } catch {
      setError('Failed to save. Try again.')
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#111111] p-6 shadow-2xl"
        style={{ animation: 'modalIn 0.18s ease-out' }}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold tracking-wide text-white">Log Tournament</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-600 transition hover:bg-white/5 hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Tournament Name">
            <input
              ref={firstInputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sunday Million"
              className={inputClass}
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
            <Field label="Cashout (€)">
              <input
                type="number"
                min="0"
                step="0.01"
                value={cashout}
                onChange={(e) => setCashout(e.target.value)}
                placeholder="0.00"
                className={inputClass}
                required
              />
            </Field>
          </div>

          {profit !== null && (
            <div
              className={`rounded-lg px-4 py-2.5 text-center font-mono text-sm font-bold ${
                profit >= 0
                  ? 'bg-emerald-950/60 text-emerald-400'
                  : 'bg-red-950/60 text-red-400'
              }`}
            >
              {format(profit)} result
            </div>
          )}

          <Field label="Date">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Type (optional)">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={inputClass}
              >
                <option value="">—</option>
                {TOURNAMENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
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
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </Field>
          </div>

          {error && (
            <p className="rounded-lg bg-red-950/50 px-3 py-2 text-xs text-red-400">{error}</p>
          )}

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
              {submitting ? 'Saving…' : 'Log Tournament'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
