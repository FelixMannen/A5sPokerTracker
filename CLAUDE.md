# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A5s Poker Tracker — Electron desktop app for logging MTT (multi-table tournament) results.

## Commands

```bash
npm run dev          # start app in development mode
npm run build        # compile TypeScript and build distributable
npm run typecheck    # type-check without emitting
npm run rebuild      # recompile better-sqlite3 for Electron (run after fresh install)
```

After a fresh `npm install`, always run `npm run rebuild` before `npm run dev`.

## Process architecture

Three isolated environments — never cross these boundaries:

| Process | Location | Can access |
|---|---|---|
| Main | `src/main/` | SQLite, Node.js, native APIs |
| Preload | `src/preload/index.ts` | contextBridge only — no DB, no React |
| Renderer | `src/renderer/` | React, Tailwind, `window.api` only |

Data flow: `React → window.api.x() → IPC → ipcMain.handle() → queries.ts → SQLite`

`better-sqlite3` is synchronous and must only run in the main process.

## IPC conventions

- Channel names in `src/main/ipc/handlers.ts`, format: `session:create`, `session:get-all`
- Handlers return plain serializable objects — no class instances, use ISO strings for dates
- Renderer never calls `ipcRenderer` directly — always via `window.api`

## Data model

**sessions table** — central type defined in `src/renderer/types/index.ts`:

| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | auto-increment |
| tournament_name | TEXT | optional |
| date | TEXT | ISO date string, defaults to today |
| buy_in | REAL | required |
| cashout | REAL | required, 0 if busted |
| type | TEXT | optional — e.g. PKO, Freezeout, Satellite |
| registration_time | TEXT | optional — Early, Medium, or Late |

Profit = cashout − buy_in (computed in queries or UI, not stored).

## Build notes

- **electron-vite** manages the three-process build (`electron.vite.config.ts`)
- **better-sqlite3** requires native compilation — `npm run rebuild` uses `@electron/rebuild`
- A `patch-package` patch in `patches/` fixes VS 2026 toolset detection in `@electron/node-gyp` — applied automatically via `postinstall`
- Node 22 LTS required (managed via fnm) — Node 25 has no prebuilt binaries for native modules
