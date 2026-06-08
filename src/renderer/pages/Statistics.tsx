import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  PieChart,
  Pie,
} from 'recharts'
import type { Session } from '../types'
import { useCurrency } from '../context/CurrencyContext'

// ─── Data types ──────────────────────────────────────────────────────────────

interface RoiGroup {
  label: string
  count: number
  totalBuyIn: number
  totalCashout: number
  roi: number
  totalProfit: number
  singleSample: boolean
}

interface TypeBreakdownItem {
  type: string
  count: number
  pct: number
  color: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BUY_IN_TIERS = [
  { label: '€0–10', min: 0, max: 10 },
  { label: '€10–20', min: 10.01, max: 20 },
  { label: '€20+', min: 20.01, max: Infinity },
]

const TYPE_COLORS: Record<string, string> = {
  PKO: '#00d46a',
  Freezeout: '#22d3ee',
  Satellite: '#fb923c',
  Bounty: '#a78bfa',
  'Mystery Bounty': '#ec4899',
  Hyper: '#facc15',
  Turbo: '#f97316',
  Other: '#6b7280',
  Unspecified: '#2d3748',
}

function typeColor(t: string): string {
  return TYPE_COLORS[t] ?? '#6b7280'
}

// ─── Data computation ─────────────────────────────────────────────────────────

function computeBuyInGroups(sessions: Session[]): RoiGroup[] {
  return BUY_IN_TIERS.map(({ label, min, max }) => {
    const group = sessions.filter((s) => s.buy_in >= min && s.buy_in <= max)
    const totalBuyIn = group.reduce((s, t) => s + t.buy_in, 0)
    const totalCashout = group.reduce((s, t) => s + t.cashout, 0)
    const totalProfit = totalCashout - totalBuyIn
    return {
      label,
      count: group.length,
      totalBuyIn,
      totalCashout,
      roi: totalBuyIn > 0 ? (totalProfit / totalBuyIn) * 100 : 0,
      totalProfit,
      singleSample: group.length === 1,
    }
  }).filter((g) => g.count > 0)
}

function computeTypeGroups(sessions: Session[]): RoiGroup[] {
  const map = new Map<string, Session[]>()
  for (const s of sessions) {
    const key = s.type ?? 'Unspecified'
    const arr = map.get(key) ?? []
    arr.push(s)
    map.set(key, arr)
  }
  return Array.from(map.entries())
    .map(([label, group]) => {
      const totalBuyIn = group.reduce((s, t) => s + t.buy_in, 0)
      const totalCashout = group.reduce((s, t) => s + t.cashout, 0)
      const totalProfit = totalCashout - totalBuyIn
      return {
        label,
        count: group.length,
        totalBuyIn,
        totalCashout,
        roi: totalBuyIn > 0 ? (totalProfit / totalBuyIn) * 100 : 0,
        totalProfit,
        singleSample: group.length === 1,
      }
    })
    .sort((a, b) => b.roi - a.roi)
}

function computeTypeBreakdown(sessions: Session[]): TypeBreakdownItem[] {
  const map = new Map<string, number>()
  for (const s of sessions) {
    const key = s.type ?? 'Unspecified'
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  const total = sessions.length
  return Array.from(map.entries())
    .map(([type, count]) => ({ type, count, pct: (count / total) * 100, color: typeColor(type) }))
    .sort((a, b) => b.count - a.count)
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#111] p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-gray-600">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function SingleSampleNote() {
  return (
    <p className="mt-3 text-[10px] text-gray-700">
      * Single tournament — ROI not statistically meaningful
    </p>
  )
}

function EmptyChart() {
  return (
    <div className="flex h-40 items-center justify-center text-sm text-gray-700">
      No data yet
    </div>
  )
}

// ─── ROI bar chart tooltip ─────────────────────────────────────────────────────

function RoiTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  const { format } = useCurrency()
  if (!active || !payload?.length) return null
  const d: RoiGroup = payload[0].payload
  return (
    <div className="rounded-xl border border-white/10 bg-[#1c1c1c] p-3 text-xs shadow-xl">
      <p className="mb-2 font-semibold text-white">{d.label}</p>
      <div className="space-y-1 font-mono">
        <div className="flex justify-between gap-6">
          <span className="text-gray-500">Tournaments</span>
          <span className="text-gray-300">{d.count}{d.singleSample ? ' *' : ''}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-gray-500">ROI</span>
          <span className={d.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}>
            {d.roi >= 0 ? '+' : ''}{d.roi.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-gray-500">Net profit</span>
          <span className={d.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
            {format(d.totalProfit)}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── ROI horizontal bar chart ─────────────────────────────────────────────────

function RoiBarChart({ data }: { data: RoiGroup[] }) {
  if (!data.length) return <EmptyChart />
  const hasSingle = data.some((d) => d.singleSample)
  const absMax = Math.max(...data.map((d) => Math.abs(d.roi)), 10)
  const domain: [number, number] = [-(absMax * 1.15), absMax * 1.15]

  const labelWithAsterisk = (label: string, singleSample: boolean) =>
    singleSample ? `${label} *` : label

  return (
    <>
      <ResponsiveContainer width="100%" height={Math.max(data.length * 48, 120)}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid horizontal={false} strokeDasharray="4 4" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            type="number"
            domain={domain}
            tick={{ fill: '#4b5563', fontSize: 10, fontFamily: 'monospace' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v > 0 ? '+' : ''}${v.toFixed(0)}%`}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={72}
            tick={({ x, y, payload }) => {
              const entry = data.find((d) => d.label === payload.value)
              return (
                <text
                  x={x}
                  y={y}
                  dy={4}
                  textAnchor="end"
                  fill={entry?.singleSample ? '#4b5563' : '#9ca3af'}
                  fontSize={11}
                >
                  {labelWithAsterisk(payload.value, entry?.singleSample ?? false)}
                </text>
              )
            }}
            tickLine={false}
            axisLine={false}
          />
          <ReferenceLine x={0} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
          <Tooltip content={<RoiTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="roi" radius={4} maxBarSize={28}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.singleSample ? '#2a2a2a' : entry.roi >= 0 ? '#10b981' : '#ef4444'}
                stroke={entry.singleSample ? '#374151' : 'none'}
                strokeWidth={entry.singleSample ? 1 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {hasSingle && <SingleSampleNote />}
    </>
  )
}

// ─── Type breakdown ───────────────────────────────────────────────────────────

function DonutTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null
  const d: TypeBreakdownItem = payload[0].payload
  return (
    <div className="rounded-xl border border-white/10 bg-[#1c1c1c] p-3 text-xs shadow-xl">
      <p className="font-semibold text-white">{d.type}</p>
      <p className="mt-1 font-mono text-gray-300">{d.count} tournaments · {d.pct.toFixed(1)}%</p>
    </div>
  )
}

function TypeBreakdownChart({ data }: { data: TypeBreakdownItem[] }) {
  if (!data.length) return <EmptyChart />

  return (
    <div className="flex gap-6">
      {/* Donut */}
      <div className="shrink-0">
        <ResponsiveContainer width={180} height={180}>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="type"
              innerRadius={54}
              outerRadius={82}
              paddingAngle={2}
              startAngle={90}
              endAngle={-270}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend table */}
      <div className="flex-1 space-y-2 self-center">
        {data.map((entry) => (
          <div key={entry.type} className="flex items-center gap-2.5">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="min-w-0 flex-1 truncate text-xs text-gray-400">{entry.type}</span>
            <span className="font-mono text-xs tabular-nums text-gray-500">{entry.count}</span>
            <span className="w-12 text-right font-mono text-xs tabular-nums text-gray-600">
              {entry.pct.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-gray-700">
      <span style={{ fontSize: 56, lineHeight: 1, opacity: 0.2 }}>♠</span>
      <p className="text-base font-light">No tournaments logged yet</p>
      <p className="text-sm text-gray-800">Log your first tournament to see statistics</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Statistics({ sessions }: { sessions: Session[] }) {
  const buyInGroups = useMemo(() => computeBuyInGroups(sessions), [sessions])
  const typeGroups = useMemo(() => computeTypeGroups(sessions), [sessions])
  const typeBreakdown = useMemo(() => computeTypeBreakdown(sessions), [sessions])

  if (!sessions.length) return <EmptyState />

  return (
    <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2">
      <div className="grid grid-cols-2 gap-4">
        {/* ROI by Buy-in Level */}
        <Card
          title="ROI by Buy-in Level"
          subtitle="€0 up to and including €10 · from €10 up to and including €20 · €20 and over"
        >
          <RoiBarChart data={buyInGroups} />
        </Card>

        {/* ROI by Tournament Type */}
        <Card title="ROI by Tournament Type">
          <RoiBarChart data={typeGroups} />
        </Card>
      </div>

      {/* Type Breakdown */}
      <div className="mt-4">
        <Card title="Tournament Volume by Type" subtitle="Distribution of tournaments played">
          <TypeBreakdownChart data={typeBreakdown} />
        </Card>
      </div>
    </div>
  )
}
