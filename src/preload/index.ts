import { contextBridge, ipcRenderer } from 'electron'
import type { SessionAPI } from '../renderer/types'

const api: SessionAPI = {
  createSession: (data) => ipcRenderer.invoke('session:create', data),
  getAllSessions: () => ipcRenderer.invoke('session:get-all'),
  updateSession: (id, data) => ipcRenderer.invoke('session:update', id, data),
  deleteSession: (id) => ipcRenderer.invoke('session:delete', id)
}

contextBridge.exposeInMainWorld('api', api)
