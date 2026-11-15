# Kist: Build Plan

- [x] 1. Scaffold Vite React TS, Tailwind, Dexie, Recharts, `vite-plugin-pwa`, `.env.example`, `.gitignore`, `netlify.toml`
- [x] 2. `types/` interfaces and money helpers (integer cents, ZAR formatting)
- [x] 3. Dexie database, schema versioning, and repository functions (categories, expenses, goals, contributions)
- [x] 4. App shell: providers in `main.tsx`, bottom navigation, theme, mobile-first layout
- [x] 5. Categories screen: create, edit, set monthly limit, soft delete; seed default categories
- [x] 6. Add-expense flow: numeric keypad amount, category picker, date, note
- [x] 7. Expense list with edit and delete
- [x] 8. Monthly dashboard: month switcher, spent vs limit per category, totals, chart
- [x] 9. Savings goals: create, progress bars, add contribution
- [x] 10. Settings: currency, export/import JSON backup
- [x] 11. PWA: manifest, icons in `/public`, offline caching, update-prompt banner
- [x] 12. Verify offline: automated browser run (service worker, offline reload, add data offline, reload). Real-phone install and airplane-mode check still to do by hand
- [x] 13. Build, lint and `tsc --noEmit` clean; no console errors; 375px check (34 browser checks, 50 unit tests)
- [ ] 14. Deploy to Netlify; test install on Android (deferred: deploys happen together after every project is built). GitHub push done
- [ ] 15. (Phase 2) Netlify Function + Neon sync with `updatedAt` last-write-wins and soft deletes
- [ ] 16. (Phase 2) Recurring expenses and CSV export
- [x] 17. README (offline architecture, sync design, demo bullets, screenshots)
