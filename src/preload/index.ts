import { contextBridge } from 'electron'

// Session API will be wired up here as IPC handlers are added
contextBridge.exposeInMainWorld('api', {})
