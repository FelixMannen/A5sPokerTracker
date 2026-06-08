import { useState, useEffect, useRef } from 'react'
import type { PendingTournament } from '../../types'
import { useCurrency } from '../../context/CurrencyContext'
import { ModalShell, Field, inputClass } from './ModalShell'

interface Props {
  tournament: PendingTournament
  onConfirm: (cashout: number) => Promise<void>
  onClose: () => void
}

// Finishes an in-progress tournament: enter the cashout, then it's committed to the dataset
export default function CashoutModal({ tournament, onConfirm, onClose }: Props) {
  const { format, formatAbs } = useCurrency()
  const [cashout, setCashout] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const result = cashout !== '' ? Number(cashout) - tournament.buy_in : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const co = Number(cashout)
    if (cashout === '' || co < 0) {
      setError('Enter cashout (0 if busted)')
      return
    }

    setError('')
    setSubmitting(true)
    try {
      await onConfirm(co)
      onClose()
    } catch {
      setError('Failed to save. Try again.')
      setSubmitting(false)
    }
  }

  return (
    <ModalShell title="Finish Tournament" onClose={onClose} maxWidth="max-w-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg border border-white/5 bg-[#161616] px-4 py-3">
          <p className="truncate text-sm font-semibold text-gray-200">
            {tournament.tournament_name ?? 'Unnamed tournament'}
          </p>
          <p className="mt-0.5 font-mono text-xs text-gray-500">Buy-in {formatAbs(tournament.buy_in)}</p>
        </div>

        <Field label="Cashout (€)">
          <input
            ref={inputRef}
            type="number"
            min="0"
            step="0.01"
            value={cashout}
            onChange={(e) => setCashout(e.target.value)}
            placeholder="0.00 (0 if busted)"
            className={inputClass}
            required
          />
        </Field>

        {result !== null && (
          <div
            className={`rounded-lg px-4 py-2.5 text-center font-mono text-sm font-bold ${
              result >= 0 ? 'bg-emerald-950/60 text-emerald-400' : 'bg-red-950/60 text-red-400'
            }`}
          >
            {format(result)} result
          </div>
        )}

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
            {submitting ? 'Saving…' : 'Finish & Commit'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}
