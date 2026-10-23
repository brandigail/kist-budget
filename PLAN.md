# Kist: Build Plan

- [ ] 1. Scaffold Vite React TS, Tailwind, Dexie, Recharts, `vite-plugin-pwa`, `.env.example`, `.gitignore`, `netlify.toml`
- [ ] 2. `types/` interfaces and money helpers (integer cents, ZAR formatting)
- [ ] 3. Dexie database, schema versioning, and repository functions (categories, expenses, goals, contributions)
- [ ] 4. App shell: providers in `main.tsx`, bottom navigation, theme, mobile-first layout
- [ ] 5. Categories screen: create, edit, set monthly limit, soft delete; seed default categories
- [ ] 6. Add-expense flow: numeric keypad amount, category picker, date, note
- [ ] 7. Expense list with edit and delete
- [ ] 8. Monthly dashboard: month switcher, spent vs limit per category, totals, chart
- [ ] 9. Savings goals: create, progress bars, add contribution
- [ ] 10. Settings: currency, export/import JSON backup
- [ ] 11. PWA: manifest, icons in `/public`, offline caching, update-prompt banner
- [ ] 12. Verify offline in DevTools and on a real phone (install, airplane mode, add data, reopen)
- [ ] 13. Build, lint and `tsc --noEmit` clean; no console errors; 375px check
- [ ] 14. Deploy to Netlify; test install on Android; push to GitHub; update root `LINKS.md`
- [ ] 15. (Phase 2) Netlify Function + Neon sync with `updatedAt` last-write-wins and soft deletes
- [ ] 16. (Phase 2) Recurring expenses and CSV export
- [ ] 17. README (offline architecture, sync design, demo bullets, screenshots)
