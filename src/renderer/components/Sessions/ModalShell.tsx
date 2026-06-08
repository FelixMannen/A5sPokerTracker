import { useEffect } from 'react'

export const inputClass =
  'w-full rounded-lg bg-[#1a1a1a] border border-white/10 px-3 py-2.5 text-sm text-gray-100 placeholder-gray-600 outline-none transition focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30'

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">
        {label}
      </label>
      {children}
    </div>
  )
}

export function ModalShell({
  title,
  onClose,
  children,
  maxWidth = 'max-w-md'
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
  maxWidth?: string
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={`relative w-full ${maxWidth} rounded-2xl border border-white/10 bg-[#111111] p-6 shadow-2xl`}
        style={{ animation: 'modalIn 0.18s ease-out' }}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold tracking-wide text-white">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-600 transition hover:bg-white/5 hover:text-gray-300"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
