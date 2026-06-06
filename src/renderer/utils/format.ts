export function formatCurrency(amount: number, showSign = true): string {
  const abs = Math.abs(amount).toFixed(2)
  const sign = showSign ? (amount >= 0 ? '+' : '-') : amount < 0 ? '-' : ''
  return `${sign}$${abs}`
}

export function formatROI(profit: number, totalBuyIn: number): string {
  if (totalBuyIn === 0) return '—'
  const roi = (profit / totalBuyIn) * 100
  const sign = roi >= 0 ? '+' : ''
  return `${sign}${roi.toFixed(1)}%`
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}
