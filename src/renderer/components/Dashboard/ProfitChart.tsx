import { useMemo, useCallback, useState, useEffect, useRef } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import type { Session } from '../../types'
import { useCurrency } from '../../context/CurrencyContext'

interface ChartPoint {
  index: number
  cumulative: number
  sessionProfit: number
  session: Session
}

const SPARSE_THRESHOLD = 50
const ANIMATION_MS = 1000

function buildChartData(sessions: Session[]): ChartPoint[] {
  const chrono = [...sessions].reverse()
  let cumulative = 0
  return chrono.map((session, i) => {
    const sessionProfit = session.cashout - session.buy_in
    cumulative += sessionProfit
    return { index: i + 1, cumulative, sessionProfit, session }
  })
}

// Returns null (show all dots) or a Set of indices that get a landmark dot
function computeDotSet(data: ChartPoint[]): Set<number> | null {
  if (data.length <= SPARSE_THRESHOLD) return null

  const n = Math.max(2, Math.round(data.length * 0.05))

  const wins = [...data]
    .filter((d) => d.sessionProfit > 0)
    .sort((a, b) => b.sessionProfit - a.sessionProfit)
    .slice(0, n)

  return new Set(wins.map((d) => d.index))
}

// ------- Tooltip (needs currency — defined as a component so it can call the hook) -------

function Row({
  label,
  value,
  color = 'text-gray-300',
  mono = true
}: {
  label: string
  value: string
  color?: string
  mono?: boolean
}) {
  return (
    <div className="flex justify-between gap-6">
      <span className="text-gray-500">{label}</span>
      <span className={`${color} ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  const { format, formatAbs } = useCurrency()
  if (!active || !payload?.length) return null
  const point: ChartPoint = payload[0].payload
  const { session, sessionProfit, cumulative } = point

  return (
    <div className="rounded-xl border border-white/10 bg-[#1c1c1c] p-4 shadow-2xl text-sm">
      {session.tournament_name && (
        <p className="mb-1 font-semibold text-white">{session.tournament_name}</p>
      )}
      <p className="mb-3 text-xs text-gray-500">{session.date}</p>
      <div className="space-y-1.5 font-mono">
        <Row label="Buy-in" value={formatAbs(session.buy_in)} />
        <Row label="Cashout" value={formatAbs(session.cashout)} />
        {session.type && <Row label="Type" value={session.type} mono={false} />}
        {session.registration_time && (
          <Row label="Reg" value={session.registration_time} mono={false} />
        )}
        <div className="my-1.5 border-t border-white/10" />
        <Row
          label="Result"
          value={format(sessionProfit)}
          color={sessionProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}
        />
        <Row
          label="Running"
          value={format(cumulative)}
          color={cumulative >= 0 ? 'text-emerald-400' : 'text-red-400'}
        />
      </div>
    </div>
  )
}

// ------- Dot renderers -------

function renderActiveDot(props: any) {
  const { cx, cy, payload } = props
  const isWin = payload.sessionProfit >= 0
  return (
    <circle
      key={`adot-${payload.index}`}
      cx={cx}
      cy={cy}
      r={7}
      fill={isWin ? '#00d46a' : '#ff4757'}
      stroke="#fff"
      strokeWidth={2}
      style={{ filter: `drop-shadow(0 0 8px ${isWin ? '#00ff88' : '#ff4757'})` }}
    />
  )
}

function makeDotRenderer(dotSet: Set<number> | null) {
  return function renderDot(props: any) {
    const { cx, cy, payload } = props
    const idx: number = payload.index

    // Sparse mode: hide non-landmark dots with a zero-radius invisible circle
    if (dotSet !== null && !dotSet.has(idx)) {
      return <circle key={`dot-hidden-${idx}`} cx={cx} cy={cy} r={0} fill="none" />
    }

    const isWin = payload.sessionProfit >= 0
    const isLandmark = dotSet !== null
    const r = isLandmark ? 5.5 : 4
    const strokeW = isLandmark ? 2 : 1.5
    const glow = isLandmark ? 7 : 4

    return (
      <circle
        key={`dot-${idx}`}
        cx={cx}
        cy={cy}
        r={r}
        fill={isWin ? '#00d46a' : '#ff4757'}
        stroke={isWin ? '#00ff88' : '#ff6b7a'}
        strokeWidth={strokeW}
        style={{ filter: `drop-shadow(0 0 ${glow}px ${isWin ? '#00ff8866' : '#ff475766'})` }}
      />
    )
  }
}

// ------- Empty state -------

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-gray-600">
      <span style={{ fontSize: 72, lineHeight: 1, opacity: 0.3 }}>♠</span>
      <p className="text-xl font-light tracking-wide">No tournaments logged yet</p>
      <p className="text-sm text-gray-700">Hit "Log Tournament" to start tracking</p>
    </div>
  )
}

// ------- Main component -------

export default function ProfitChart({ sessions }: { sessions: Session[] }) {
  const { format, currency } = useCurrency()

  // Chart data — recomputed only when sessions change
  const data = useMemo(() => buildChartData(sessions), [sessions])

  // Dot set — recomputed only when data changes, never on currency changes
  const dotSet = useMemo(() => computeDotSet(data), [data])

  // Stable dot renderer — only recreated when dotSet changes
  const renderDot = useCallback(makeDotRenderer(dotSet), [dotSet])

  // Y-axis domain — recomputed only when data changes
  const { yMin, yMax, zeroPercent } = useMemo(() => {
    if (!data.length) return { yMin: -100, yMax: 100, zeroPercent: 50 }
    const values = data.map((d) => d.cumulative)
    const rawMin = Math.min(...values)
    const rawMax = Math.max(...values)
    const pad = Math.max(Math.abs(rawMax - rawMin) * 0.12, 10)
    const yMin = Math.min(0, rawMin) - pad
    const yMax = Math.max(0, rawMax) + pad
    const zeroPercent = ((yMax - 0) / (yMax - yMin)) * 100
    return { yMin, yMax, zeroPercent }
  }, [data])

  // Animation: only play on initial mount or when tournament count changes.
  // Disabled after the sweep completes so currency toggles don't re-animate.
  const [animate, setAnimate] = useState(true)
  const prevLen = useRef(data.length)
  useEffect(() => {
    if (data.length !== prevLen.current) {
      prevLen.current = data.length
      setAnimate(true)
    }
    const t = setTimeout(() => setAnimate(false), ANIMATION_MS + 100)
    return () => clearTimeout(t)
  }, [data.length])

  // Y-axis formatter — stable ref so the callback identity doesn't change on currency toggle,
  // but always reads the latest format function
  const formatRef = useRef(format)
  formatRef.current = format
  const tickFormatter = useCallback((v: number) => formatRef.current(v), [])

  if (!data.length) return <EmptyState />

  const gradientId = 'profitAreaFill'
  const yAxisWidth = currency === 'NOK' ? 88 : 72

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 20, right: 40, left: 10, bottom: 30 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00ff88" stopOpacity={0.0} />
            <stop offset={`${Math.max(0, zeroPercent - 15)}%`} stopColor="#00ff88" stopOpacity={0.18} />
            <stop offset={`${zeroPercent}%`} stopColor="#00ff88" stopOpacity={0.06} />
            <stop offset={`${zeroPercent}%`} stopColor="#ff4757" stopOpacity={0.06} />
            <stop offset={`${Math.min(100, zeroPercent + 15)}%`} stopColor="#ff4757" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#ff4757" stopOpacity={0.0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.04)" vertical={false} />

        <XAxis
          dataKey="index"
          tick={{ fill: '#4b5563', fontSize: 11, fontFamily: 'monospace' }}
          tickLine={false}
          axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
          label={{ value: 'Tournament #', position: 'insideBottom', offset: -16, fill: '#374151', fontSize: 11 }}
        />

        <YAxis
          domain={[yMin, yMax]}
          tick={{ fill: '#4b5563', fontSize: 11, fontFamily: 'monospace' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={tickFormatter}
          width={yAxisWidth}
        />

        <Tooltip
          content={<ChartTooltip />}
          cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1, strokeDasharray: '3 3' }}
        />

        <ReferenceLine y={0} stroke="rgba(255,255,255,0.18)" strokeDasharray="5 5" strokeWidth={1} />

        <Area
          type="monotone"
          dataKey="cumulative"
          stroke="#00ff88"
          strokeWidth={2.5}
          fill={`url(#${gradientId})`}
          dot={renderDot}
          activeDot={renderActiveDot}
          isAnimationActive={animate}
          animationDuration={ANIMATION_MS}
          animationEasing="ease-out"
          style={{ filter: 'drop-shadow(0 0 6px rgba(0,255,136,0.25))' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
