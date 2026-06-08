import { ipcMain } from 'electron'
import type Database from 'better-sqlite3'
import {
  createSession,
  getAllSessions,
  updateSession,
  deleteSession,
  startPlaySession,
  getActivePlaySession,
  finishPlaySession,
  cancelPlaySession,
  getFinishedPlaySessions,
  addPendingTournament,
  getPendingTournaments,
  finishPendingTournament,
  deletePendingTournament
} from '../database/queries'
import type { NewSession, NewPendingTournament } from '../../renderer/types'

export function registerHandlers(db: Database.Database): void {
  ipcMain.handle('session:create', (_, data: NewSession) => createSession(db, data))
  ipcMain.handle('session:get-all', () => getAllSessions(db))
  ipcMain.handle('session:update', (_, id: number, data: Partial<NewSession>) => updateSession(db, id, data))
  ipcMain.handle('session:delete', (_, id: number) => deleteSession(db, id))

  ipcMain.handle('play-session:start', () => startPlaySession(db))
  ipcMain.handle('play-session:get-active', () => getActivePlaySession(db))
  ipcMain.handle('play-session:finish', (_, id: number, title: string | null, notes: string | null) =>
    finishPlaySession(db, id, title, notes)
  )
  ipcMain.handle('play-session:cancel', (_, id: number) => cancelPlaySession(db, id))
  ipcMain.handle('play-session:get-finished', () => getFinishedPlaySessions(db))

  ipcMain.handle('pending:add', (_, data: NewPendingTournament) => addPendingTournament(db, data))
  ipcMain.handle('pending:get', (_, playSessionId: number) => getPendingTournaments(db, playSessionId))
  ipcMain.handle('pending:finish', (_, id: number, cashout: number) => finishPendingTournament(db, id, cashout))
  ipcMain.handle('pending:delete', (_, id: number) => deletePendingTournament(db, id))
}
