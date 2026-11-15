import { Plus } from 'lucide-react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { ThemeToggle } from './ThemeToggle'
import { UpdatePrompt } from './UpdatePrompt'

/** The add button lives on the list-style screens; forms and settings don't need it. */
const SHOW_ADD_ON = new Set(['/', '/expenses'])

export function AppShell() {
  const { pathname } = useLocation()
  return (
    <div className="flex min-h-dvh flex-col bg-amber-50/40 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-white px-4 py-1 dark:border-stone-800 dark:bg-stone-900">
        <h1 className="text-lg font-bold text-amber-800 dark:text-amber-400">Kist</h1>
        <ThemeToggle />
      </header>
      <div className="flex flex-1 flex-col md:flex-row">
        <BottomNav />
        <main className="mx-auto w-full max-w-2xl flex-1 p-4 pb-40 md:pb-8">
          <Outlet />
        </main>
      </div>
      {SHOW_ADD_ON.has(pathname) && (
        <Link
          to="/add"
          aria-label="Add expense"
          className="fixed bottom-20 right-4 z-20 flex size-14 items-center justify-center rounded-full bg-amber-700 text-white shadow-lg transition-colors hover:bg-amber-800 md:bottom-8 md:right-8"
        >
          <Plus size={28} aria-hidden />
        </Link>
      )}
      <UpdatePrompt />
    </div>
  )
}
