import type Database from 'better-sqlite3'
import type {
  Session,
  NewSession,
  PlaySession,
  PlaySessionSummary,
  PendingTournament,
  NewPendingTournament
} from '../../renderer/types'

export function createSession(db: Database.Database, data: NewSession): Session {
  const stmt = db.prepare(`
    INSERT INTO sessions (tournament_name, date, buy_in, cashout, type, registration_time)
    VALUES (@tournament_name, @date, @buy_in, @cashout, @type, @registration_time)
  `)
  const result = stmt.run(data)
  return getSessionById(db, result.lastInsertRowid as number)!
}

export function getAllSessions(db: Database.Database): Session[] {
  return db.prepare('SELECT * FROM sessions ORDER BY date DESC, id DESC').all() as Session[]
}

export function getSessionById(db: Database.Database, id: number): Session | null {
  return db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as Session | null
}

export function updateSession(db: Database.Database, id: number, data: Partial<NewSession>): Session {
  const fields = Object.keys(data).map((k) => `${k} = @${k}`).join(', ')
  db.prepare(`UPDATE sessions SET ${fields} WHERE id = @id`).run({ ...data, id })
  return getSessionById(db, id)!
}

export function deleteSession(db: Database.Database, id: number): void {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(id)
}

// ----- Live play sessions -----

export function getActivePlaySession(db: Database.Database): PlaySession | null {
  const row = db
    .prepare(`SELECT * FROM play_sessions WHERE status = 'active' ORDER BY id DESC LIMIT 1`)
    .get() as PlaySession | undefined
  return row ?? null
}

export function getPlaySessionById(db: Database.Database, id: number): PlaySession | null {
  return (db.prepare('SELECT * FROM play_sessions WHERE id = ?').get(id) as PlaySession) ?? null
}

// Idempotent: if a session is already active, return it rather than opening a second one
export function startPlaySession(db: Database.Database): PlaySession {
  const existing = getActivePlaySession(db)
  if (existing) return existing
  const res = db
    .prepare(`INSERT INTO play_sessions (started_at, status) VALUES (?, 'active')`)
    .run(new Date().toISOString())
  return getPlaySessionById(db, res.lastInsertRowid as number)!
}

export function finishPlaySession(
  db: Database.Database,
  id: number,
  title: string | null,
  notes: string | null
): PlaySession {
  const pending = db
    .prepare(`SELECT COUNT(*) AS c FROM pending_tournaments WHERE play_session_id = ?`)
    .get(id) as { c: number }
  if (pending.c > 0) throw new Error('UNFINISHED_TOURNAMENTS')

  db.prepare(
    `UPDATE play_sessions SET status = 'finished', ended_at = @ended_at, title = @title, notes = @notes WHERE id = @id`
  ).run({ id, ended_at: new Date().toISOString(), title, notes })
  return getPlaySessionById(db, id)!
}

// Discard a session started by mistake: remove its in-progress tournaments and the
// session itself, but keep any already-committed tournaments (real results) by
// unlinking them from the discarded session.
export function cancelPlaySession(db: Database.Database, id: number): void {
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM pending_tournaments WHERE play_session_id = ?').run(id)
    db.prepare('UPDATE sessions SET play_session_id = NULL WHERE play_session_id = ?').run(id)
    db.prepare('DELETE FROM play_sessions WHERE id = ?').run(id)
  })
  tx()
}

export function getFinishedPlaySessions(db: Database.Database): PlaySessionSummary[] {
  return db
    .prepare(
      `SELECT p.*,
         COUNT(s.id)                              AS tournament_count,
         COALESCE(SUM(s.cashout - s.buy_in), 0)   AS net_profit,
         COALESCE(SUM(s.buy_in), 0)               AS total_buy_in
       FROM play_sessions p
       LEFT JOIN sessions s ON s.play_session_id = p.id
       WHERE p.status = 'finished'
       GROUP BY p.id
       ORDER BY p.ended_at DESC`
    )
    .all() as PlaySessionSummary[]
}

// ----- Pending (in-progress) tournaments -----

export function getPendingTournamentById(db: Database.Database, id: number): PendingTournament | null {
  return (
    (db.prepare('SELECT * FROM pending_tournaments WHERE id = ?').get(id) as PendingTournament) ?? null
  )
}

export function getPendingTournaments(db: Database.Database, playSessionId: number): PendingTournament[] {
  return db
    .prepare('SELECT * FROM pending_tournaments WHERE play_session_id = ? ORDER BY id ASC')
    .all(playSessionId) as PendingTournament[]
}

export function addPendingTournament(
  db: Database.Database,
  data: NewPendingTournament
): PendingTournament {
  const res = db
    .prepare(
      `INSERT INTO pending_tournaments
         (play_session_id, tournament_name, date, buy_in, type, registration_time, created_at)
       VALUES
         (@play_session_id, @tournament_name, @date, @buy_in, @type, @registration_time, @created_at)`
    )
    .run({ ...data, created_at: new Date().toISOString() })
  return getPendingTournamentById(db, res.lastInsertRowid as number)!
}

export function deletePendingTournament(db: Database.Database, id: number): void {
  db.prepare('DELETE FROM pending_tournaments WHERE id = ?').run(id)
}

// Commit a pending tournament into the main dataset (atomically): insert it as a
// completed session row with the entered cashout, then drop the pending row.
export function finishPendingTournament(
  db: Database.Database,
  id: number,
  cashout: number
): Session {
  const commit = db.transaction(() => {
    const p = getPendingTournamentById(db, id)
    if (!p) throw new Error('PENDING_NOT_FOUND')
    const res = db
      .prepare(
        `INSERT INTO sessions
           (tournament_name, date, buy_in, cashout, type, registration_time, play_session_id)
         VALUES
           (@tournament_name, @date, @buy_in, @cashout, @type, @registration_time, @play_session_id)`
      )
      .run({
        tournament_name: p.tournament_name,
        date: p.date,
        buy_in: p.buy_in,
        cashout,
        type: p.type,
        registration_time: p.registration_time,
        play_session_id: p.play_session_id
      })
    db.prepare('DELETE FROM pending_tournaments WHERE id = ?').run(id)
    return res.lastInsertRowid as number
  })
  return getSessionById(db, commit())!
}
