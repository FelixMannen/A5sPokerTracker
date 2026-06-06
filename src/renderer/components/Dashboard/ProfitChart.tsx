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

function computeDotSet(data: ChartPoint[]): Set<number> | null {
  if (data.length <= SPARSE_THRESHOLD) return null
  const n = Math.max(2, Math.round(data.length * 0.05))
  const wins = [...data]
    .filter((d) => d.sessionProfit > 0)
    .sort((a, b) => b.sessionProfit - a.sessionProfit)
    .slice(0, n)
  return new Set(wins.map((d) => d.index))
}

// ------- Hover bridge: captures Recharts hover state without rendering anything -------

interface HoverBridgeProps {
  active?: boolean
  payload?: any[]
  onHover: (point: ChartPoint | null) => void
}

function HoverBridge({ active, payload, onHover }: HoverBridgeProps) {
  const isActive = !!active
  const point: ChartPoint | null = isActive && payload?.length ? payload[0].payload : null
  const pointIndex = point?.index ?? null

  useEffect(() => {
    onHover(isActive ? point : null)
  }, [isActive, pointIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

// ------- Fixed info panel (top-left of chart) -------

function InfoRow({
  label,
  value,
  color = 'text-gray-300'
}: {
  label: string
  value: string
  color?: string
}) {
  return (
    <div className="flex justify-between gap-8">
      <span className="text-gray-600 text-xs">{label}</span>
      <span className={`font-mono text-xs tabular-nums ${color}`}>{value}</span>
    </div>
  )
}

function InfoPanel({ point, dimmed }: { point: ChartPoint; dimmed: boolean }) {
  const { format, formatAbs } = useCurrency()
  const { session, sessionProfit, cumulative } = point

  return (
    <div
      className="absolute left-3 top-3 z-10 w-52 rounded-xl border border-white/5 bg-[#111]/90 p-3 backdrop-blur-sm pointer-events-none"
      style={{ opacity: dimmed ? 0.35 : 1, transition: 'opacity 0.25s ease' }}
    >
      {/* Content fades in when point changes */}
      <div key={point.index} style={{ animation: 'tooltipContentIn 0.15s ease-out' }}>
        <div className="mb-2">
          <p className="text-xs font-semibold text-gray-200 leading-tight truncate">
            {session.tournament_name ?? `Tournament #${point.index}`}
          </p>
          <p className="text-[10px] text-gray-600 mt-0.5">{session.date}</p>
        </div>

        <div className="space-y-1 mb-2">
          <InfoRow label="Buy-in" value={formatAbs(session.buy_in)} />
          <InfoRow label="Cashout" value={formatAbs(session.cashout)} />
          {session.type && <InfoRow label="Type" value={session.type} />}
          {session.registration_time && <InfoRow label="Reg" value={session.registration_time} />}
        </div>

        <div className="border-t border-white/5 pt-2 space-y-1">
          <InfoRow
            label="Result"
            value={format(sessionProfit)}
            color={sessionProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}
          />
          <InfoRow
            label="Running"
            value={format(cumulative)}
            color={cumulative >= 0 ? 'text-emerald-400' : 'text-red-400'}
          />
        </div>
      </div>
    </div>
  )
}

// ------- Dot renderers -------

function makeDotRenderer(dotSet: Set<number> | null) {
  return function renderDot(props: any) {
    const { cx, cy, payload } = props
    const idx: number = payload.index

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

  const data = useMemo(() => buildChartData(sessions), [sessions])
  const dotSet = useMemo(() => computeDotSet(data), [data])
  const renderDot = useCallback(makeDotRenderer(dotSet), [dotSet])

  // Info panel state
  const [displayPoint, setDisplayPoint] = useState<ChartPoint | null>(null)
  const [isHovering, setIsHovering] = useState(false)
  const displayPointRef = useRef<ChartPoint | null>(null)
  const isHoveringRef = useRef(false)

  // Pre-populate with the most recent tournament on load / data change
  useEffect(() => {
    if (data.length) {
      const last = data[data.length - 1]
      if (!displayPointRef.current) {
        displayPointRef.current = last
        setDisplayPoint(last)
      }
    }
  }, [data])

  const handleHover = useCallback((point: ChartPoint | null) => {
    if (point) {
      if (point.index !== displayPointRef.current?.index) {
        displayPointRef.current = point
        setDisplayPoint(point)
      }
      if (!isHoveringRef.current) {
        isHoveringRef.current = true
        setIsHovering(true)
      }
    } else {
      if (isHoveringRef.current) {
        isHoveringRef.current = false
        setIsHovering(false)
      }
    }
  }, [])

  // Y-axis domain
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

  // Animation: only on data length change, disabled after sweep so currency changes don't re-animate
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

  // Stable Y-axis formatter via ref — doesn't change identity on currency toggle
  const formatRef = useRef(format)
  formatRef.current = format
  const tickFormatter = useCallback((v: number) => formatRef.current(v), [])

  if (!data.length) return <EmptyState />

  const gradientId = 'profitAreaFill'
  const yAxisWidth = currency === 'NOK' ? 88 : 72

  return (
    <div className="relative h-full w-full">
      {displayPoint && (
        <InfoPanel point={displayPoint} dimmed={!isHovering} />
      )}

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 20, right: 40, left: 10, bottom: 30 }}
        >
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
            cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1, strokeDasharray: '3 3' }}
            content={<HoverBridge onHover={handleHover} />}
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
    </div>
  )
}
