import { useState } from 'react'

interface Props {
  // 'YYYY-MM-DD' dates that have a session → that session's net result (EUR)
  markedDates: Map<string, number>
  selectedDate: string | null // the currently viewed session's date
  onSelectDate: (date: string) => void
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const pad = (n: number) => String(n).padStart(2, '0')
const cellKey = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}` // m is 0-based

export default function SessionCalendar({ markedDates, selectedDate, onSelectDate }: Props) {
  const [view, setView] = useState(() => {
    const base = selectedDate ?? new Date().toISOString().slice(0, 10)
    const [y, m] = base.split('-').map(Number)
    return { year: y, month: m - 1 }
  })

  // Monday-first weekday of the 1st (JS getDay: 0=Sun)
  const startWeekday = (new Date(view.year, view.month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()

  const cells: (number | null)[] = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const prevMonth = () =>
    setView((v) => (v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 }))
  const nextMonth = () =>
    setView((v) => (v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 }))

  const navBtn =
    'flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition hover:bg-white/5 hover:text-gray-200'

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0d0d0d] p-4">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={prevMonth} className={navBtn} aria-label="Previous month">
          ‹
        </button>
        <span className="text-sm font-semibold text-gray-200">
          {MONTHS[view.month]} {view.year}
        </span>
        <button onClick={nextMonth} className={navBtn} aria-label="Next month">
          ›
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-[10px] font-medium tracking-wide text-gray-600">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={`b${i}`} />
          const key = cellKey(view.year, view.month, d)
          const marked = markedDates.has(key)
          const profit = marked && (markedDates.get(key) as number) >= 0
          const selected = key === selectedDate
          return (
            <button
              key={key}
              disabled={!marked}
              onClick={() => marked && onSelectDate(key)}
              className={`relative flex h-9 items-center justify-center rounded-lg text-xs tabular-nums transition ${
                selected
                  ? `font-bold text-white ${profit ? 'bg-emerald-600' : 'bg-red-600'}`
                  : marked
                    ? `cursor-pointer font-semibold text-gray-200 ${profit ? 'hover:bg-emerald-600/20' : 'hover:bg-red-600/20'}`
                    : 'cursor-default text-gray-700'
              }`}
            >
              {d}
              {marked && !selected && (
                <span
                  className={`absolute bottom-1 h-1 w-1 rounded-full ${profit ? 'bg-emerald-400' : 'bg-red-400'}`}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
