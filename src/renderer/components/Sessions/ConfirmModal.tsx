import { useState } from 'react'
import { ModalShell } from './ModalShell'

interface Props {
  title: string
  message: string
  confirmLabel: string
  danger?: boolean
  onConfirm: () => Promise<void> | void
  onClose: () => void
}

export default function ConfirmModal({ title, message, confirmLabel, danger, onConfirm, onClose }: Props) {
  const [busy, setBusy] = useState(false)

  async function handleConfirm() {
    setBusy(true)
    try {
      await onConfirm()
      onClose()
    } catch {
      setBusy(false)
    }
  }

  const confirmClass = danger
    ? 'bg-red-600 hover:bg-red-500'
    : 'bg-emerald-600 hover:bg-emerald-500'

  return (
    <ModalShell title={title} onClose={onClose} maxWidth="max-w-sm">
      <p className="text-sm leading-relaxed text-gray-400">{message}</p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-gray-400 transition hover:border-white/20 hover:text-gray-200"
        >
          Keep Session
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={busy}
          className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 ${confirmClass}`}
        >
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </ModalShell>
  )
}
