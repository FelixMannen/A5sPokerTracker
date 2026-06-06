import type Database from 'better-sqlite3'

export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_name   TEXT,
      date              TEXT NOT NULL,
      buy_in            REAL NOT NULL,
      cashout           REAL NOT NULL,
      type              TEXT,
      registration_time TEXT
    )
  `)
}
