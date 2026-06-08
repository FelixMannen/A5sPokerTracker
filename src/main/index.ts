import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import Database from 'better-sqlite3'
import { initSchema } from './database/schema'
import { registerHandlers } from './ipc/handlers'
import { importFromJsonIfPresent } from './database/importJson'

function createDatabase(): Database.Database {
  const dbPath = join(app.getPath('userData'), 'sessions.db')
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  initSchema(db)
  importFromJsonIfPresent(db)
  return db
}

function createWindow(db: Database.Database): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  registerHandlers(db)

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  const rendererUrl = process.env['ELECTRON_RENDERER_URL']
  if (rendererUrl) {
    mainWindow.loadURL(rendererUrl)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  const db = createDatabase()
  createWindow(db)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(db)
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
