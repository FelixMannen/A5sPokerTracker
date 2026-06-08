import { useState, useMemo, useEffect } from 'react'
import type { Session, PlaySessionSummary } from '../../types'
import { useCurrency } from '../../context/CurrencyContext'
import SessionCalendar from './SessionCalendar'

interface Props {
  finished: PlaySessionSummary[] // ordered newest-first (ended_at DESC)
  sessions: Session[]
  onStart: () => void
}

// Local YYYY-MM-DD from an ISO timestamp (avoids UTC off-by-one)
function localDateKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function TournamentRow({ session }: { session: Session }) {
  const { formatAbs, format } = useCurrency()
  const result = session.cashout - session.buy_in
  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/5 bg-[#101010] px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-200">
          {session.tournament_name ?? 'Unnamed tournament'}
        </p>
        <p className="mt-0.5 font-mono text-xs text-gray-600">
          {formatAbs(session.buy_in)} → {formatAbs(session.cashout)}
          {session.type ? ` · ${session.type}` : ''}
        </p>
      </div>
      <span
        className={`shrink-0 font-mono text-sm font-bold ${
          result >= 0 ? 'text-emerald-400' : 'text-red-400'
        }`}
      >
        {format(result)}
      </span>
    </div>
  )
}

export default function SessionHistory({ finished, sessions, onStart }: Props) {
  const { format } = useCurrency()
  const [selectedId, setSelectedId] = useState<number | null>(finished[0]?.id ?? null)

  // Keep the selection valid as the finished list changes (e.g. a new session is saved)
  useEffect(() => {
    if (finished.length === 0) {
      setSelectedId(null)
    } else if (selectedId === null || !finished.some((f) => f.id === selectedId)) {
      setSelectedId(finished[0].id)
    }
  }, [finished, selectedId])

  const index = useMemo(() => finished.findIndex((f) => f.id === selectedId), [finished, selectedId])
  const current = index >= 0 ? finished[index] : finished[0]

  // Map each calendar date to a session (id + net); newest wins when several share a day
  const dateInfo = useMemo(() => {
    const m = new Map<string, { id: number; net: number }>()
    for (let i = finished.length - 1; i >= 0; i--) {
      const f = finished[i]
      m.set(localDateKey(f.ended_at ?? f.started_at), { id: f.id, net: f.net_profit })
    }
    return m
  }, [finished])

  const markedDates = useMemo(() => {
    const m = new Map<string, number>()
    for (const [key, info] of dateInfo) m.set(key, info.net)
    return m
  }, [dateInfo])

  const tournaments = useMemo(
    () => (current ? sessions.filter((s) => s.play_session_id === current.id) : []),
    [sessions, current]
  )

  if (!current) return null

  const stamp = current.ended_at ?? current.started_at
  const selectedDate = localDateKey(stamp)
  const niceDate = new Date(stamp).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const goNewer = () => index > 0 && setSelectedId(finished[index - 1].id)
  const goOlder = () => index < finished.length - 1 && setSelectedId(finished[index + 1].id)

  const arrowBtn =
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-gray-300 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30'

  return (
    <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600">Session History</h2>
        <button
          onClick={onStart}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-500 active:scale-95"
          style={{ boxShadow: '0 0 20px rgba(0,200,100,0.2)' }}
        >
          ▶ Start Session
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <SessionCalendar
          markedDates={markedDates}
          selectedDate={selectedDate}
          onSelectDate={(d) => {
            const info = dateInfo.get(d)
            if (info) setSelectedId(info.id)
          }}
        />

        <div className="rounded-2xl border border-white/5 bg-[#0d0d0d] p-5">
          {/* Header with chronological navigation */}
          <div className="mb-4 flex items-center gap-3">
            <button onClick={goOlder} disabled={index >= finished.length - 1} className={arrowBtn} aria-label="Older session">
              ←
            </button>
            <div className="min-w-0 flex-1 text-center">
              <h3 className="truncate text-lg font-semibold text-gray-100">
                {current.title ?? `Session · ${niceDate}`}
              </h3>
              <p className="text-xs text-gray-500">{niceDate}</p>
            </div>
            <button onClick={goNewer} disabled={index <= 0} className={arrowBtn} aria-label="Newer session">
              →
            </button>
          </div>

          {/* Aggregates */}
          <div className="mb-4 flex items-center justify-center gap-8 rounded-xl border border-white/5 bg-[#101010] py-3">
            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">Tournaments</p>
              <p className="mt-0.5 font-mono text-base font-bold text-gray-200">{current.tournament_count}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">Net Result</p>
              <p
                className={`mt-0.5 font-mono text-base font-bold ${
                  current.net_profit >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {format(current.net_profit)}
              </p>
            </div>
          </div>

          {/* Notes */}
          {current.notes && (
            <div className="mb-4 rounded-xl border border-white/5 bg-[#101010] px-4 py-3 text-sm text-gray-400">
              {current.notes}
            </div>
          )}

          {/* Tournaments */}
          {tournaments.length > 0 ? (
            <div className="space-y-2">
              {tournaments.map((t) => (
                <TournamentRow key={t.id} session={t} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-gray-600">
              No tournaments were recorded in this session.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
