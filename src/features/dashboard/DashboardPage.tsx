import { useLiveQuery } from 'dexie-react-hooks'
import { lazy, Suspense, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { MonthSwitcher } from '../../components/MonthSwitcher'
import { ProgressBar } from '../../components/ProgressBar'
import { cardClass, dangerText, mutedText } from '../../components/ui'
import { db } from '../../db/schema'
import { summarizeMonth } from '../../lib/budget'
import { formatMoney, formatMoneyShort } from '../../lib/money'
import { useMonth } from '../../providers/month'
import { useCurrency } from '../settings/useCurrency'

// The chart library is the biggest dependency, so it loads after the numbers have rendered.
const SpendChart = lazy(() => import('./SpendChart').then((m) => ({ default: m.SpendChart })))

export function DashboardPage() {
  const { month } = useMonth()
  const currency = useCurrency()
  const categories = useLiveQuery(() => db.categories.toArray())
  const expenses = useLiveQuery(() => db.expenses.where('date').between(`${month}-01`, `${month}-32`, true, true).toArray(), [month])

  const summary = useMemo(
    () => (categories && expenses ? summarizeMonth(categories, expenses, month) : null),
    [categories, expenses, month],
  )

  if (!summary) return <p className={mutedText}>Loading…</p>

  const overBudget = summary.totalBudget > 0 && summary.totalSpent > summary.totalBudget
  const rows = [...summary.rows].sort((a, b) => b.spent - a.spent)

  return (
    <section className="space-y-4">
      <MonthSwitcher />

      <div className={cardClass}>
        <p className={`text-sm ${mutedText}`}>Spent this month</p>
        <p className="text-3xl font-bold tabular-nums">{formatMoney(summary.totalSpent, currency)}</p>
        {summary.totalBudget > 0 ? (
          <>
            <p className={`mt-1 text-sm ${overBudget ? dangerText : mutedText}`}>
              {overBudget
                ? `${formatMoney(summary.totalSpent - summary.totalBudget, currency)} over the ${formatMoneyShort(summary.totalBudget, currency)} budget`
                : `${formatMoney(summary.remaining, currency)} left of ${formatMoneyShort(summary.totalBudget, currency)}`}
            </p>
            <div className="mt-3">
              <ProgressBar percent={summary.percent} label="Total budget used" over={overBudget} />
            </div>
          </>
        ) : (
          <p className={`mt-1 text-sm ${mutedText}`}>
            No budget set yet. <Link to="/budget" className="font-medium text-amber-800 underline dark:text-amber-400">Set monthly limits</Link>.
          </p>
        )}
      </div>

      {summary.expenseCount === 0 ? (
        <div className={`${cardClass} text-center`}>
          <p className="font-medium">Nothing spent this month</p>
          <p className={`text-sm ${mutedText}`}>Tap the + button to add your first expense.</p>
        </div>
      ) : (
        <>
          <div className={cardClass}>
            <h3 className="font-semibold">Where it went</h3>
            <Suspense fallback={<div className="h-52" />}>
              <SpendChart rows={rows} currency={currency} />
            </Suspense>
          </div>

          <div className={cardClass}>
            <h3 className="font-semibold">By category</h3>
            <ul className="mt-3 space-y-4">
              {rows.map((row) => (
                <li key={row.category.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="flex min-w-0 items-center gap-2 font-medium">
                      <span className="size-3 shrink-0 rounded-full" style={{ background: row.category.color }} aria-hidden />
                      <span className="truncate">
                        {row.category.name}
                        {row.removed && <span className={`ml-1 text-xs font-normal ${mutedText}`}>(removed)</span>}
                      </span>
                    </p>
                    <p className="shrink-0 text-sm tabular-nums">
                      {formatMoney(row.spent, currency)}
                      {row.limit > 0 && <span className={mutedText}> / {formatMoneyShort(row.limit, currency)}</span>}
                    </p>
                  </div>
                  {row.limit > 0 && (
                    <>
                      <div className="mt-1.5">
                        <ProgressBar percent={row.percent} label={`${row.category.name} budget used`} color={row.category.color} over={row.over} />
                      </div>
                      <p className={`mt-1 text-xs ${row.over ? dangerText : mutedText}`}>
                        {row.over ? `Over by ${formatMoney(-row.remaining, currency)}` : `${formatMoney(row.remaining, currency)} left`}
                      </p>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  )
}
