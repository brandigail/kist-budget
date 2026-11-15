import { useLiveQuery } from 'dexie-react-hooks'
import { Pencil, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MonthSwitcher } from '../../components/MonthSwitcher'
import { cardClass, iconButton, mutedText } from '../../components/ui'
import { db } from '../../db/schema'
import { groupByDay } from '../../lib/budget'
import { formatDay } from '../../lib/dates'
import { formatMoney } from '../../lib/money'
import { useMonth } from '../../providers/month'
import type { Expense } from '../../types'
import { useCurrency } from '../settings/useCurrency'
import { deleteExpense, restoreExpense } from './expenseRepo'

const UNDO_MS = 6000

export function ExpensesPage() {
  const { month } = useMonth()
  const currency = useCurrency()
  const [undo, setUndo] = useState<Expense | null>(null)

  const categories = useLiveQuery(() => db.categories.toArray())
  const expenses = useLiveQuery(() => db.expenses.where('date').between(`${month}-01`, `${month}-32`, true, true).toArray(), [month])

  const names = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c])), [categories])
  const groups = useMemo(() => groupByDay((expenses ?? []).filter((e) => !e.deletedAt)), [expenses])
  const total = groups.reduce((sum, g) => sum + g.total, 0)

  useEffect(() => {
    if (!undo) return
    const timer = window.setTimeout(() => setUndo(null), UNDO_MS)
    return () => window.clearTimeout(timer)
  }, [undo])

  async function remove(expense: Expense) {
    await deleteExpense(expense.id)
    setUndo(expense)
  }

  return (
    <section className="space-y-4">
      <MonthSwitcher />
      <p className={`text-center text-sm ${mutedText}`}>
        {groups.reduce((n, g) => n + g.expenses.length, 0)} expenses · {formatMoney(total, currency)}
      </p>

      {expenses && groups.length === 0 && (
        <div className={`${cardClass} text-center`}>
          <p className="font-medium">No expenses in this month</p>
          <p className={`text-sm ${mutedText}`}>Tap the + button to add one.</p>
        </div>
      )}

      {groups.map((group) => (
        <div key={group.date}>
          <div className="flex items-baseline justify-between px-1 pb-1">
            <h3 className="text-sm font-semibold">{formatDay(group.date)}</h3>
            <p className={`text-sm tabular-nums ${mutedText}`}>{formatMoney(group.total, currency)}</p>
          </div>
          <ul className="space-y-2">
            {group.expenses.map((e) => {
              const category = names.get(e.categoryId)
              return (
                <li key={e.id} className={`${cardClass} flex items-center gap-2 !p-2 !pl-3`}>
                  <span className="size-3 shrink-0 rounded-full" style={{ background: category?.color ?? '#78716c' }} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{e.note || category?.name || 'Expense'}</p>
                    <p className={`truncate text-sm ${mutedText}`}>{category?.name ?? 'Unknown category'}</p>
                  </div>
                  <p className="shrink-0 font-semibold tabular-nums">{formatMoney(e.amount, currency)}</p>
                  <Link to={`/expenses/${e.id}`} aria-label={`Edit ${e.note || 'expense'} on ${formatDay(e.date)}`} className={iconButton}>
                    <Pencil size={18} aria-hidden />
                  </Link>
                  <button type="button" aria-label={`Delete ${e.note || 'expense'} on ${formatDay(e.date)}`} onClick={() => void remove(e)} className={`${iconButton} text-red-700 dark:text-red-400`}>
                    <Trash2 size={18} aria-hidden />
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ))}

      {undo && (
        <div role="status" className="fixed inset-x-3 bottom-36 z-30 mx-auto flex max-w-md items-center gap-3 rounded-xl bg-stone-900 p-3 text-sm text-white shadow-lg md:bottom-4">
          <p className="flex-1">Expense deleted.</p>
          <button
            type="button"
            className="min-h-11 rounded-lg px-3 font-semibold text-amber-300 hover:bg-stone-800"
            onClick={() => {
              void restoreExpense(undo.id)
              setUndo(null)
            }}
          >
            Undo
          </button>
        </div>
      )}
    </section>
  )
}
