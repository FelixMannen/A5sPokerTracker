import { createContext, useContext, useState, useEffect, useCallback } from 'react'

type CurrencyCode = 'EUR' | 'USD' | 'NOK'

interface Rates {
  USD: number
  NOK: number
}

interface CurrencyContextValue {
  currency: CurrencyCode
  symbol: string
  ratesLoaded: boolean
  cycleCurrency: () => void
  convert: (eurAmount: number) => number
  format: (eurAmount: number, showSign?: boolean) => string
  formatAbs: (eurAmount: number) => string
}

// Cycle starts at EUR since that's the stored/native currency
const CYCLE: CurrencyCode[] = ['EUR', 'USD', 'NOK']
const SYMBOLS: Record<CurrencyCode, string> = { EUR: '€', USD: '$', NOK: 'kr' }
const FALLBACK: Rates = { USD: 1.08, NOK: 11.6 }

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyCode>('EUR')
  const [rates, setRates] = useState<Rates>(FALLBACK)
  const [ratesLoaded, setRatesLoaded] = useState(false)

  useEffect(() => {
    fetch('https://api.frankfurter.app/latest?from=EUR&to=USD,NOK')
      .then((r) => r.json())
      .then((data: { rates: { USD: number; NOK: number } }) => {
        setRates({ USD: data.rates.USD, NOK: data.rates.NOK })
      })
      .catch(() => {
        // silently use fallback
      })
      .finally(() => setRatesLoaded(true))
  }, [])

  const cycleCurrency = useCallback(() => {
    setCurrency((prev) => {
      const idx = CYCLE.indexOf(prev)
      return CYCLE[(idx + 1) % CYCLE.length]
    })
  }, [])

  // All stored amounts are in EUR; this converts to the active display currency
  const convert = useCallback(
    (eurAmount: number): number => {
      if (currency === 'EUR') return eurAmount
      if (currency === 'USD') return eurAmount * rates.USD
      return eurAmount * rates.NOK
    },
    [currency, rates]
  )

  const format = useCallback(
    (eurAmount: number, showSign = true): string => {
      const converted = convert(eurAmount)
      const abs = Math.abs(converted)
      const sym = SYMBOLS[currency]
      const sign = showSign ? (eurAmount >= 0 ? '+' : '-') : eurAmount < 0 ? '-' : ''
      const formatted = currency === 'NOK' ? abs.toFixed(0) : abs.toFixed(2)
      return currency === 'NOK' ? `${sign}${sym} ${formatted}` : `${sign}${sym}${formatted}`
    },
    [convert, currency]
  )

  const formatAbs = useCallback(
    (eurAmount: number): string => {
      const converted = convert(Math.abs(eurAmount))
      const sym = SYMBOLS[currency]
      const formatted = currency === 'NOK' ? converted.toFixed(0) : converted.toFixed(2)
      return currency === 'NOK' ? `${sym} ${formatted}` : `${sym}${formatted}`
    },
    [convert, currency]
  )

  return (
    <CurrencyContext.Provider
      value={{ currency, symbol: SYMBOLS[currency], ratesLoaded, cycleCurrency, convert, format, formatAbs }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider')
  return ctx
}
