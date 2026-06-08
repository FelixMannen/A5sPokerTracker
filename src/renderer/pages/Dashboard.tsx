import { useState, useMemo } from 'react'
import { useSessions } from '../hooks/useSessions'
import { usePlaySession } from '../hooks/usePlaySession'
import ProfitChart from '../components/Dashboard/ProfitChart'
import StatBar from '../components/Dashboard/StatBar'
import LogTournamentModal from '../components/LogTournamentModal'
import Statistics from './Statistics'
import Sessions from './Sessions'

type Page = 'graph' | 'statistics' | 'sessions'

function NavTab({
  label,
  active,
  onClick,
  indicator
}: {
  label: string
  active: boolean
  onClick: () => void
  indicator?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? 'bg-white/10 text-white' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
      }`}
    >
      {label}
      {indicator && (
        <span className="relative flex h-1.5 w-1.5 items-center justify-center">
          <span className="absolute h-1.5 w-1.5 animate-ping rounded-full bg-emerald-400/70" />
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </span>
      )}
    </button>
  )
}

export default function Dashboard() {
  const { sessions, addSession, refetch } = useSessions()
  const play = usePlaySession(refetch)
  const [showModal, setShowModal] = useState(false)
  const [page, setPage] = useState<Page>('graph')

  const tournamentNames = useMemo(
    () => [...new Set(sessions.map((s) => s.tournament_name).filter(Boolean) as string[])],
    [sessions]
  )

  return (
    <div className="flex h-screen flex-col bg-[#0a0a0a] text-white" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-lg text-emerald-500" style={{ fontFamily: 'serif' }}>♠</span>
            <span className="text-sm font-semibold tracking-wider text-gray-300">A5s Poker Tracker</span>
          </div>
          <nav className="flex items-center gap-1">
            <NavTab label="Graph" active={page === 'graph'} onClick={() => setPage('graph')} />
            <NavTab label="Statistics" active={page === 'statistics'} onClick={() => setPage('statistics')} />
            <NavTab
              label="Sessions"
              active={page === 'sessions'}
              onClick={() => setPage('sessions')}
              indicator={!!play.active}
            />
          </nav>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-500 active:scale-95"
          style={{ boxShadow: '0 0 20px rgba(0,200,100,0.2)' }}
        >
          <span className="text-base leading-none">+</span>
          Log Tournament
        </button>
      </header>

      {page === 'graph' && (
        <>
          <StatBar sessions={sessions} />
          <main className="min-h-0 flex-1 px-4 pb-4">
            <div className="h-full rounded-2xl border border-white/5 bg-[#0d0d0d]">
              <ProfitChart sessions={sessions} />
            </div>
          </main>
        </>
      )}

      {page === 'statistics' && (
        <Statistics sessions={sessions} />
      )}

      {page === 'sessions' && (
        <Sessions play={play} sessions={sessions} />
      )}

      {showModal && (
        <LogTournamentModal
          onSubmit={addSession}
          onClose={() => setShowModal(false)}
          tournamentNames={tournamentNames}
        />
      )}
    </div>
  )
}
