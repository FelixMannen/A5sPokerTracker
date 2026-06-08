// Sessions page — run a live "sitting": add tournaments you're currently playing,
// finish each with a cashout (committing it to the dataset), then close out the session.
import { useState, useEffect, useMemo } from 'react'
import type { Session, PendingTournament } from '../types'
import type { PlaySessionController } from '../hooks/usePlaySession'
import { useCurrency } from '../context/CurrencyContext'
import AddTournamentModal from '../components/Sessions/AddTournamentModal'
import CashoutModal from '../components/Sessions/CashoutModal'
import FinishSessionModal from '../components/Sessions/FinishSessionModal'
import ConfirmModal from '../components/Sessions/ConfirmModal'
import SessionHistory from '../components/Sessions/SessionHistory'

interface Props {
  play: PlaySessionController
  sessions: Session[]
}

// Live-updating elapsed time since an ISO timestamp
function useElapsed(startedAt: string | undefined): string {
  const [, tick] = useState(0)
  useEffect(() => {
    if (!startedAt) return
    const t = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [startedAt])

  if (!startedAt) return ''
  const secs = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-medium tracking-wide text-gray-400">
      {children}
    </span>
  )
}

function InProgressCard({
  tournament,
  onFinish,
  onCancel
}: {
  tournament: PendingTournament
  onFinish: () => void
  onCancel: () => void
}) {
  const { formatAbs } = useCurrency()
  return (
    <div className="relative rounded-xl border border-amber-500/20 bg-[#141414] p-4">
      <button
        onClick={onCancel}
        title="Remove from session"
        className="absolute right-2.5 top-2.5 rounded-md p-1 text-gray-700 transition hover:bg-white/5 hover:text-gray-400"
      >
        ✕
      </button>

      <div className="mb-2 flex items-center gap-2">
        <span className="relative flex h-2 w-2 items-center justify-center">
          <span className="absolute h-2 w-2 animate-ping rounded-full bg-amber-400/70" />
          <span className="h-2 w-2 rounded-full bg-amber-400" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-400/90">
          In Progress
        </span>
      </div>

      <p className="truncate pr-5 text-sm font-semibold text-gray-100">
        {tournament.tournament_name ?? 'Unnamed tournament'}
      </p>
      <p className="mt-0.5 font-mono text-xs text-gray-500">Buy-in {formatAbs(tournament.buy_in)}</p>

      {(tournament.type || tournament.registration_time) && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {tournament.type && <Tag>{tournament.type}</Tag>}
          {tournament.registration_time && <Tag>{tournament.registration_time} reg</Tag>}
        </div>
      )}

      <button
        onClick={onFinish}
        className="mt-3 w-full rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 active:scale-[0.98]"
      >
        Finish
      </button>
    </div>
  )
}

function CompletedCard({ session }: { session: Session }) {
  const { formatAbs, format } = useCurrency()
  const result = session.cashout - session.buy_in
  return (
    <div className="rounded-xl border border-white/5 bg-[#101010] p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-500/80">
          Completed
        </span>
      </div>
      <p className="truncate text-sm font-semibold text-gray-300">
        {session.tournament_name ?? 'Unnamed tournament'}
      </p>
      <p className="mt-0.5 font-mono text-xs text-gray-600">
        {formatAbs(session.buy_in)} → {formatAbs(session.cashout)}
      </p>
      <p
        className={`mt-2 font-mono text-sm font-bold ${
          result >= 0 ? 'text-emerald-400' : 'text-red-400'
        }`}
      >
        {format(result)}
      </p>
    </div>
  )
}

export default function Sessions({ play, sessions }: Props) {
  const { active, pending, finished, loading, start, addTournament, finishTournament, cancelTournament, finishSession, cancelSession } = play
  const elapsed = useElapsed(active?.started_at)

  const [showAdd, setShowAdd] = useState(false)
  const [cashoutFor, setCashoutFor] = useState<PendingTournament | null>(null)
  const [showFinishSession, setShowFinishSession] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [blockedMessage, setBlockedMessage] = useState('')

  // Tournaments already committed during the current active session
  const completedThisSession = useMemo(
    () => (active ? sessions.filter((s) => s.play_session_id === active.id) : []),
    [active, sessions]
  )

  // Previously used names, for the Add Tournament autocomplete
  const tournamentNames = useMemo(
    () => [...new Set(sessions.map((s) => s.tournament_name).filter(Boolean) as string[])],
    [sessions]
  )

  function handleFinishSessionClick() {
    if (pending.length > 0) {
      setBlockedMessage(
        `You still have ${pending.length} tournament${pending.length === 1 ? '' : 's'} in progress. ` +
          'Finish or remove each one before closing the session.'
      )
      return
    }
    setBlockedMessage('')
    setShowFinishSession(true)
  }

  // Avoid flashing the empty/history view before the initial load resolves
  if (loading) return <div className="flex-1" />

  // ----- No active session: browse history, or prompt to start the first one -----
  if (!active) {
    if (finished.length === 0) {
      return (
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#0d0d0d] px-6 py-16">
            <span className="mb-4 text-5xl" style={{ opacity: 0.25 }}>♠</span>
            <h2 className="text-lg font-semibold text-gray-200">No sessions yet</h2>
            <p className="mt-1 max-w-sm text-center text-sm text-gray-600">
              Start your first session to track the tournaments you're playing right now. They stay
              separate from your stats until you finish each one with a cashout.
            </p>
            <button
              onClick={start}
              className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-500 active:scale-95"
              style={{ boxShadow: '0 0 24px rgba(0,200,100,0.25)' }}
            >
              ▶ Start Session
            </button>
          </div>
        </div>
      )
    }
    return <SessionHistory finished={finished} sessions={sessions} onStart={start} />
  }

  // ----- Active session -----
  return (
    <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2">
      {/* Session header bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/20 bg-[#0d0d0d] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5 items-center justify-center">
            <span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-emerald-400/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-100">Live Session</p>
            <p className="font-mono text-xs text-gray-500">
              {elapsed} · {pending.length} in progress · {completedThisSession.length} completed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 active:scale-95"
          >
            <span className="text-base leading-none">+</span> Add Tournament
          </button>
          <button
            onClick={handleFinishSessionClick}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:text-white"
          >
            Finish Session
          </button>
          <button
            onClick={() => setShowCancel(true)}
            title="Discard this session"
            className="rounded-xl border border-white/5 px-3 py-2 text-sm font-medium text-gray-500 transition hover:border-red-500/40 hover:text-red-400"
          >
            Cancel
          </button>
        </div>
      </div>

      {blockedMessage && (
        <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-950/30 px-4 py-3 text-sm text-amber-300">
          {blockedMessage}
        </div>
      )}

      {/* In progress */}
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-600">
        In Progress
      </h3>
      {pending.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-gray-600">
          No tournaments in progress. Hit “Add Tournament” when you sit down at one.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {pending.map((t) => (
            <InProgressCard
              key={t.id}
              tournament={t}
              onFinish={() => setCashoutFor(t)}
              onCancel={() => cancelTournament(t.id)}
            />
          ))}
        </div>
      )}

      {/* Completed this session */}
      {completedThisSession.length > 0 && (
        <>
          <h3 className="mb-3 mt-7 text-xs font-semibold uppercase tracking-widest text-gray-600">
            Completed This Session
          </h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {completedThisSession.map((s) => (
              <CompletedCard key={s.id} session={s} />
            ))}
          </div>
        </>
      )}

      {/* Modals */}
      {showAdd && (
        <AddTournamentModal
          onAdd={addTournament}
          onClose={() => setShowAdd(false)}
          tournamentNames={tournamentNames}
        />
      )}
      {cashoutFor && (
        <CashoutModal
          tournament={cashoutFor}
          onConfirm={(cashout) => finishTournament(cashoutFor.id, cashout)}
          onClose={() => setCashoutFor(null)}
        />
      )}
      {showFinishSession && (
        <FinishSessionModal onConfirm={finishSession} onClose={() => setShowFinishSession(false)} />
      )}
      {showCancel && (
        <ConfirmModal
          title="Cancel session?"
          message={
            (pending.length > 0
              ? `${pending.length} in-progress tournament${pending.length === 1 ? '' : 's'} will be discarded. `
              : '') +
            (completedThisSession.length > 0
              ? `${completedThisSession.length} already-finished tournament${
                  completedThisSession.length === 1 ? '' : 's'
                } will be kept in your stats. `
              : '') +
            'This session will not be saved.'
          }
          confirmLabel="Cancel Session"
          danger
          onConfirm={cancelSession}
          onClose={() => setShowCancel(false)}
        />
      )}
    </div>
  )
}
