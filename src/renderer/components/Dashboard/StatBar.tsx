import type { Session } from '../../types'
import { formatROI } from '../../utils/format'
import { useCurrency } from '../../context/CurrencyContext'

interface StatCardProps {
  label: string
  value: string
  positive: boolean | null
  clickable?: boolean
  currency?: string
  onClick?: () => void
}

function StatCard({ label, value, positive, clickable, currency, onClick }: StatCardProps) {
  const valueColor =
    positive === null ? 'text-gray-200' : positive ? 'text-emerald-400' : 'text-red-400'

  return (
    <div
      onClick={onClick}
      className={`relative rounded-xl bg-[#141414] px-5 py-3 border border-white/5 transition-colors ${
        clickable ? 'cursor-pointer hover:bg-[#1a1a1a] hover:border-white/10 select-none' : ''
      }`}
    >
      <div className="mb-1 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">{label}</p>
        {clickable && currency && (
          <span className="flex items-center gap-1 rounded-md bg-white/5 px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-gray-500 border border-white/5">
            <span style={{ fontSize: 9 }}>↺</span>
            {currency}
          </span>
        )}
      </div>
      <p className={`font-mono text-xl font-bold tabular-nums ${valueColor}`}>{value}</p>
    </div>
  )
}

export default function StatBar({ sessions }: { sessions: Session[] }) {
  const { currency, cycleCurrency, format, formatAbs } = useCurrency()

  const totalProfit = sessions.reduce((s, t) => s + t.cashout - t.buy_in, 0)
  const totalBuyIn = sessions.reduce((s, t) => s + t.buy_in, 0)
  const biggestWin = sessions.reduce((m, t) => Math.max(m, t.cashout - t.buy_in), 0)

  return (
    <div className="grid grid-cols-4 gap-3 px-6 pb-3">
      <StatCard
        label="Total Profit"
        value={sessions.length ? format(totalProfit) : '—'}
        positive={sessions.length ? totalProfit >= 0 : null}
        clickable
        currency={currency}
        onClick={cycleCurrency}
      />
      <StatCard
        label="ROI"
        value={formatROI(totalProfit, totalBuyIn)}
        positive={sessions.length ? totalProfit >= 0 : null}
      />
      <StatCard
        label="Tournaments"
        value={sessions.length.toString()}
        positive={null}
      />
      <StatCard
        label="Biggest Win"
        value={sessions.length ? formatAbs(biggestWin) : '—'}
        positive={sessions.length ? biggestWin >= 0 : null}
        clickable
        currency={currency}
        onClick={cycleCurrency}
      />
    </div>
  )
}
