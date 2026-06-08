import { join } from 'path'
import { existsSync, readFileSync, unlinkSync } from 'fs'
import { app } from 'electron'
import type Database from 'better-sqlite3'
import type { NewSession } from '../../renderer/types'

export function importFromJsonIfPresent(db: Database.Database): void {
  const importPath = join(app.getPath('userData'), 'import.json')
  if (!existsSync(importPath)) return

  let sessions: NewSession[]
  try {
    sessions = JSON.parse(readFileSync(importPath, 'utf-8'))
  } catch (e) {
    console.error('[import] Failed to parse import.json:', e)
    return
  }

  const insert = db.prepare(
    `INSERT INTO sessions (tournament_name, date, buy_in, cashout, type, registration_time)
     VALUES (@tournament_name, @date, @buy_in, @cashout, @type, @registration_time)`
  )

  const run = db.transaction(() => {
    db.exec('DELETE FROM sessions')
    db.exec("DELETE FROM sqlite_sequence WHERE name='sessions'")
    for (const s of sessions) insert.run(s)
  })

  try {
    run()
    unlinkSync(importPath)
    console.log(`[import] Imported ${sessions.length} sessions from import.json`)
  } catch (e) {
    console.error('[import] Import transaction failed:', e)
  }
}
