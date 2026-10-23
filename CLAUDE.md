# Kist: Offline-First Household Management PWA (REBUILD FROM SCRATCH)

Read the portfolio-root `CLAUDE.md` first for global rules. This file is the brief for this project.

## What it is
An installable, offline-first household budget app: categories, monthly expense tracking and savings goals. It works fully without internet on Android and mobile browsers, then syncs in the background when online. The old version is broken; don't reuse its code.

## Stack
React, Vite, TypeScript strict, Tailwind CSS, Dexie.js (IndexedDB), `vite-plugin-pwa`, Recharts (simple charts), optional sync via Netlify Function + Neon Postgres. Hosted on Netlify.

## MVP (build first)
1. Offline data layer (Dexie): budget categories with monthly limits, expense entry (amount, category, date, note), and edit/delete. Works with the network off.
2. Monthly view: spent vs budget per category, month switcher, totals, and a simple chart.
3. Savings goals (target, saved so far, optional deadline) with progress bars and quick "add contribution".
Plus: installable PWA (manifest, icons, offline shell) with an update-prompt banner.

## Phase 2
Background sync to Neon (per-household passcode), recurring expenses, CSV export, multi-user household.

## Data model (put in `types/`)
`Category { id, name, monthlyLimit, color, updatedAt, deletedAt? }`, `Expense { id, categoryId, amount, date, note, updatedAt, deletedAt? }`, `Goal { id, name, target, saved, deadline?, updatedAt, deletedAt? }`, `Contribution { id, goalId, amount, date }`.

## Rules specific to this project
- Offline-first means the UI reads and writes only Dexie; the network is never in the render path. Use `useLiveQuery`.
- IDs are client-generated UUIDs. Store money as integer cents. Default currency ZAR (R), configurable in settings.
- Sync design (Phase 2): every record has `updatedAt` and soft-delete `deletedAt`; last-write-wins per record; push local changes then pull since last sync timestamp through a Netlify Function; retry when connectivity returns.
- Test offline for real: Chrome DevTools offline mode plus airplane mode on a phone. Verify the installed PWA opens with no network.
- Touch-friendly: large tap targets, bottom navigation, numeric keypad input for amounts.

## Start here
1. Confirm the currency and the starter category list with me, or default to ZAR and common household categories (groceries, transport, utilities, rent, airtime/data, savings).
2. Work through `PLAN.md` from step 1.
