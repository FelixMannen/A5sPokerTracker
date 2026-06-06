# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A5s Poker Tracker — Electron desktop app for logging and analyzing poker session results.

## Commands

```bash
npm run dev          # start Electron app in development mode (hot reload)
npm run build        # compile TypeScript and build distributable
npm run lint         # run ESLint across all source files
npm run typecheck    # run tsc without emitting (type-check only)
```

## Architecture

Electron splits execution across three environments. Each has strict constraints:

- **Main process** (`src/main/`) — Node.js. Owns the SQLite database, file system, and native APIs. Never import renderer code here.
- **Preload script** (`src/preload/index.ts`) — Isolated Node context. The only bridge between main and renderer. Uses `contextBridge.exposeInMainWorld` to expose a typed `window.api` object. Keep this minimal — only expose what the renderer needs.
- **Renderer process** (`src/renderer/`) — Browser environment. No direct Node or SQLite access. All data flows through `window.api` (the preload bridge). React + Tailwind live here.

### Data flow

```
Renderer (React) → window.api.someMethod() → IPC channel → ipcMain.handle() → queries.ts → SQLite
```

`better-sqlite3` is synchronous and must only ever run in the main process. Do not attempt to import it in the renderer or preload.

### IPC conventions

- Channel names live in `src/main/ipc/handlers.ts` — use `kebab-case` strings (e.g. `session:create`).
- All IPC handlers return plain serializable objects (no class instances, no Dates — use ISO strings).
- The preload wraps each channel in a typed function so the renderer never calls `ipcRenderer.invoke` directly.

### Key types

Shared TypeScript types are in `src/renderer/types/index.ts`. The `Session` type is the central data shape — the DB schema, IPC payloads, and UI components all reference it.

## Build tooling

electron-vite manages the three-process build. Config is in `electron.vite.config.ts`. Renderer uses Vite + React plugin; main and preload use esbuild via electron-vite's built-in handling.

`better-sqlite3` is a native module and requires a rebuild step for the target Electron version — this is handled automatically via the `electron-rebuild` script in `package.json`.
