import type Database from 'better-sqlite3'
import type { Session, NewSession } from '../../renderer/types'

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
