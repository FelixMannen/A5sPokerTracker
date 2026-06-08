import type Database from 'better-sqlite3'

export function initSchema(db: Database.Database): void {
  // Each row is one tournament (the central dataset behind the graph & stats)
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

  // Migration: link committed tournaments back to the live "sitting" they were played in
  const sessionCols = db.prepare(`PRAGMA table_info(sessions)`).all() as { name: string }[]
  if (!sessionCols.some((c) => c.name === 'play_session_id')) {
    db.exec(`ALTER TABLE sessions ADD COLUMN play_session_id INTEGER`)
  }

  // A live play session ("sitting") — groups tournaments played in one go
  db.exec(`
    CREATE TABLE IF NOT EXISTS play_sessions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT,
      notes       TEXT,
      started_at  TEXT NOT NULL,
      ended_at    TEXT,
      status      TEXT NOT NULL DEFAULT 'active'
    )
  `)

  // Tournaments currently being played in an active session — not yet in the main
  // dataset. On "Finish" a row moves into `sessions` (with a cashout) and is deleted here.
  db.exec(`
    CREATE TABLE IF NOT EXISTS pending_tournaments (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      play_session_id   INTEGER NOT NULL,
      tournament_name   TEXT,
      date              TEXT NOT NULL,
      buy_in            REAL NOT NULL,
      type              TEXT,
      registration_time TEXT,
      created_at        TEXT NOT NULL,
      FOREIGN KEY (play_session_id) REFERENCES play_sessions(id) ON DELETE CASCADE
    )
  `)
}
