import { contextBridge, ipcRenderer } from 'electron'
import type { SessionAPI } from '../renderer/types'

const api: SessionAPI = {
  createSession: (data) => ipcRenderer.invoke('session:create', data),
  getAllSessions: () => ipcRenderer.invoke('session:get-all'),
  updateSession: (id, data) => ipcRenderer.invoke('session:update', id, data),
  deleteSession: (id) => ipcRenderer.invoke('session:delete', id),

  startPlaySession: () => ipcRenderer.invoke('play-session:start'),
  getActivePlaySession: () => ipcRenderer.invoke('play-session:get-active'),
  finishPlaySession: (id, title, notes) => ipcRenderer.invoke('play-session:finish', id, title, notes),
  cancelPlaySession: (id) => ipcRenderer.invoke('play-session:cancel', id),
  getFinishedPlaySessions: () => ipcRenderer.invoke('play-session:get-finished'),

  addPendingTournament: (data) => ipcRenderer.invoke('pending:add', data),
  getPendingTournaments: (playSessionId) => ipcRenderer.invoke('pending:get', playSessionId),
  finishPendingTournament: (id, cashout) => ipcRenderer.invoke('pending:finish', id, cashout),
  deletePendingTournament: (id) => ipcRenderer.invoke('pending:delete', id)
}

contextBridge.exposeInMainWorld('api', api)
