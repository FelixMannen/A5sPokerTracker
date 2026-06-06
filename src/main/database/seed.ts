import type Database from 'better-sqlite3'

const TYPES = ['PKO', 'Freezeout', 'Satellite', 'Bounty', 'Mystery Bounty', 'Hyper', 'Turbo', null]
const REG_TIMES = ['Early', 'Medium', 'Late', null]
const BUY_INS = [5, 10, 11, 22, 33, 55, 100, 200, 500]
const NAMES = [
  'Sunday Million', 'Big €109', 'Mini Sunday Storm', 'PKO Championship',
  'Bounty Builder', 'Sunday Warm-Up', 'Mini Monday', 'Turbo Series Event',
  'Saturday Mayhem', 'High Roller Freezeout', 'Satellite to Sunday',
  null, null, null, null, null  // mix of named and unnamed
]

function rng(seed: number) {
  // deterministic pseudo-random so the data is reproducible
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)]
}

export function seedTestDatabase(db: Database.Database): void {
  const row = db.prepare('SELECT COUNT(*) as n FROM sessions').get() as { n: number }
  if (row.n > 0) return

  const insert = db.prepare(
    `INSERT INTO sessions (tournament_name, date, buy_in, cashout, type, registration_time)
     VALUES (?, ?, ?, ?, ?, ?)`
  )

  const rand = rng(42)

  const doSeed = db.transaction(() => {
    const start = new Date('2023-06-01')

    for (let i = 0; i < 1000; i++) {
      // Spread ~1 tournament per day with some variance
      const daysOffset = Math.floor(i * 0.72 + rand() * 0.5)
      const date = new Date(start)
      date.setDate(date.getDate() + daysOffset)

      const buyIn = pick(BUY_INS, rand)

      // Realistic MTT cashout distribution:
      // ~65% bust, ~20% small return, ~10% solid profit, ~5% big score
      const roll = rand()
      let cashout: number
      if (roll < 0.65) {
        cashout = 0
      } else if (roll < 0.85) {
        cashout = buyIn * (0.5 + rand() * 2)
      } else if (roll < 0.95) {
        cashout = buyIn * (3 + rand() * 7)
      } else {
        cashout = buyIn * (10 + rand() * 40)
      }
      cashout = Math.round(cashout * 100) / 100

      insert.run(
        pick(NAMES, rand),
        date.toISOString().split('T')[0],
        buyIn,
        cashout,
        pick(TYPES, rand),
        pick(REG_TIMES, rand)
      )
    }
  })

  doSeed()
}
