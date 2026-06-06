import { useState } from 'react'
import { useSessions } from '../hooks/useSessions'
import ProfitChart from '../components/Dashboard/ProfitChart'
import StatBar from '../components/Dashboard/StatBar'
import LogTournamentModal from '../components/LogTournamentModal'

export default function Dashboard() {
  const { sessions, addSession } = useSessions()
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="flex h-screen flex-col bg-[#0a0a0a] text-white" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <span className="text-lg text-emerald-500" style={{ fontFamily: 'serif' }}>♠</span>
          <span className="text-sm font-semibold tracking-wider text-gray-300">A5s Poker Tracker</span>
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

      {/* Stat bar */}
      <StatBar sessions={sessions} />

      {/* Chart */}
      <main className="min-h-0 flex-1 px-4 pb-4">
        <div className="h-full rounded-2xl border border-white/5 bg-[#0d0d0d]">
          <ProfitChart sessions={sessions} />
        </div>
      </main>

      {showModal && (
        <LogTournamentModal
          onSubmit={addSession}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
