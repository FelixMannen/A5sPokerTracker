# Build Plan

## Phase 1 — Scaffold

**Step 1** — Initialize with electron-vite
```
npm create @quick-start/electron
```
Choose: React, TypeScript. This generates the main/preload/renderer structure and wires up the build pipeline.

**Step 2** — Add Tailwind CSS
Configure Tailwind for the renderer (PostCSS + Vite plugin).

**Step 3** — Add better-sqlite3
Install and configure native module rebuilding for Electron (electron-rebuild or the vite-plugin-electron equivalent).

---

## Phase 2 — Data Layer

**Step 4** — Define SQLite schema (`src/main/database/schema.ts`)
Sessions table columns: `id`, `date`, `game_type`, `stakes`, `buy_in`, `cashout`, `duration_minutes`, `notes`.

**Step 5** — Write query functions (`src/main/database/queries.ts`)
`createSession`, `getAllSessions`, `getSessionById`, `updateSession`, `deleteSession`.

**Step 6** — Register IPC handlers (`src/main/ipc/handlers.ts`)
One `ipcMain.handle()` per query function. Return typed responses.

**Step 7** — Expose API via preload (`src/preload/index.ts`)
`contextBridge.exposeInMainWorld('api', { ... })` — one method per IPC channel.

---

## Phase 3 — Core UI

**Step 8** — Shared types (`src/renderer/types/index.ts`)
Define `Session`, `GameType`, `NewSessionPayload` etc. These must match the DB schema.

**Step 9** — `useSessions` hook
Wraps `window.api` calls. Provides `sessions`, `addSession`, `updateSession`, `deleteSession`.

**Step 10** — SessionForm component
Form inputs: date, game type (dropdown), stakes (dropdown), buy-in, cashout, duration, notes.
Auto-computes profit = cashout - buy-in on save.

**Step 11** — SessionList component
Table of past sessions sorted by date desc. Inline delete, click-to-edit.

**Step 12** — Dashboard page
Stat cards: total profit, total sessions, hours played, $/hour.
Profit-over-time line chart (use Recharts).

---

## Phase 4 — Polish

**Step 13** — Filtering and sorting on the Sessions page
Filter by game type, stakes, date range.

**Step 14** — Export to CSV
Button that serializes `getAllSessions()` result and triggers a file save dialog via Electron's `dialog.showSaveDialog`.

**Step 15** — App icon + packaging
Add icon assets to `resources/`. Configure electron-builder for distributable output.
