# A5s Poker Tracker

A cross-platform desktop app for tracking online poker session results. Log buy-ins, cashouts, profit/loss, game type, stakes, date, and duration. View session history and performance stats over time.

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Desktop shell | Electron | Cross-platform (Windows, macOS, Linux) without a web server |
| UI | React + TypeScript | Component model suits a form-heavy data app; TypeScript catches shape mismatches early |
| Build tooling | electron-vite | Purpose-built for Electron's main/preload/renderer split; much less config than webpack |
| Database | SQLite via better-sqlite3 | Embedded, zero-config, portable single file — right for a single-user local app |
| Styling | Tailwind CSS | Fast iteration on layout and color without leaving the component file |

`better-sqlite3` is synchronous and runs in the **main process only**. The renderer communicates with it through IPC channels exposed via the preload script — this is intentional and must stay this way.

## Folder Structure

```
src/
  main/                   # Electron main process (Node.js environment)
    database/
      schema.ts           # CREATE TABLE statements
      migrations.ts       # Versioned schema migration runner
      queries.ts          # CRUD functions called by IPC handlers
    ipc/
      handlers.ts         # ipcMain.handle() registrations
    index.ts              # App entry — creates BrowserWindow, inits DB

  preload/
    index.ts              # contextBridge — exposes typed IPC API to renderer

  renderer/               # React app (browser environment, no Node access)
    components/
      Dashboard/          # Stat cards + profit chart
      SessionForm/        # New/edit session form
      SessionList/        # Session history table
      ui/                 # Shared primitives (Button, Input, etc.)
    hooks/
      useSessions.ts      # Data fetching/mutation via the preload IPC API
    pages/
      Dashboard.tsx       # Summary stats view
      Sessions.tsx        # Session history + filtering
    types/
      index.ts            # Shared TypeScript types (Session, GameType, etc.)
    utils/
      format.ts           # Currency, duration, date formatters
    App.tsx               # Root component — routing
    main.tsx              # React entry point
    index.html            # HTML shell
```
