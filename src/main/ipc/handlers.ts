import { ipcMain } from 'electron'
import type Database from 'better-sqlite3'
import { createSession, getAllSessions, updateSession, deleteSession } from '../database/queries'
import type { NewSession } from '../../renderer/types'

export function registerHandlers(db: Database.Database): void {
  ipcMain.handle('session:create', (_, data: NewSession) => createSession(db, data))
  ipcMain.handle('session:get-all', () => getAllSessions(db))
  ipcMain.handle('session:update', (_, id: number, data: Partial<NewSession>) => updateSession(db, id, data))
  ipcMain.handle('session:delete', (_, id: number) => deleteSession(db, id))
}
