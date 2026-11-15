import { useLiveQuery } from 'dexie-react-hooks'
import { CheckCircle2, ChevronDown, Pencil, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { ProgressBar } from '../../components/ProgressBar'
import { cardClass, iconButton, inputClass, mutedText, secondaryButton } from '../../components/ui'
import { db } from '../../db/schema'
import { formatDate, formatMonth, monthOf, todayISO } from '../../lib/dates'
import { goalProgress } from '../../lib/goals'
import { formatMoney, formatMoneyShort, parseAmountToCents } from '../../lib/money'
import type { CurrencyCode, Goal } from '../../types'
import { addContribution, deleteContribution } from './goalRepo'

interface Props {
  goal: Goal
  currency: CurrencyCode
  onEdit: () => void
  onDelete: () => void
}

const QUICK_ADD_RAND = [100, 500, 1000]

export function GoalCard({ goal, currency, onEdit, onDelete }: Props) {
  const today = todayISO()
  const progress = goalProgress(goal, today)
  const [custom, setCustom] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const contributions = useLiveQuery(() => db.contributions.where('goalId').equals(goal.id).toArray(), [goal.id])
  const history = [...(contributions ?? [])].sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt))

  async function addCustom(e: FormEvent) {
    e.preventDefault()
    const cents = parseAmountToCents(custom)
    if (cents === null || cents <= 0) return setError('Enter an amount above zero.')
    setError(null)
    await addContribution(goal.id, cents, today)
    setCustom('')
  }

  const status = progress.completed
    ? 'Goal reached'
    : progress.overdue
      ? `Deadline passed (${formatMonth(monthOf(goal.deadline ?? today))})`
      : progress.perMonthNeeded !== null
        ? `Save ${formatMoneyShort(progress.perMonthNeeded, currency)} a month to finish by ${formatMonth(monthOf(goal.deadline ?? today))}`
        : `${formatMoney(progress.remaining, currency)} to go`

  return (
    <li className={`${cardClass} space-y-3`}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-2 font-semibold">
            <span className="truncate">{goal.name}</span>
            {progress.completed && <CheckCircle2 size={18} className="shrink-0 text-green-700 dark:text-green-400" aria-label="Completed" />}
          </h3>
          <p className="text-sm tabular-nums">
            {formatMoney(goal.saved, currency)} <span className={mutedText}>of {formatMoney(goal.target, currency)}</span>
          </p>
        </div>
        <button type="button" aria-label={`Edit ${goal.name}`} className={iconButton} onClick={onEdit}>
          <Pencil size={18} aria-hidden />
        </button>
        <button type="button" aria-label={`Delete ${goal.name}`} className={`${iconButton} text-red-700 dark:text-red-400`} onClick={onDelete}>
          <Trash2 size={18} aria-hidden />
        </button>
      </div>

      <ProgressBar percent={progress.percent} label={`${goal.name} progress`} color={progress.completed ? '#15803d' : '#b45309'} />
      <p className={`text-sm ${progress.overdue ? 'font-medium text-red-700 dark:text-red-400' : mutedText}`}>
        {Math.floor(progress.percent)}% · {status}
      </p>

      {!progress.completed && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2" role="group" aria-label={`Quick add to ${goal.name}`}>
            {QUICK_ADD_RAND.map((rand) => (
              <button key={rand} type="button" className={secondaryButton} onClick={() => void addContribution(goal.id, rand * 100, today)}>
                +{formatMoneyShort(rand * 100, currency)}
              </button>
            ))}
          </div>
          <form onSubmit={addCustom} className="flex gap-2">
            <label className="min-w-0 flex-1 text-sm font-medium">
              <span className="sr-only">Custom amount for {goal.name}</span>
              <input className={`${inputClass} mt-0`} inputMode="decimal" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Other amount" />
            </label>
            <button type="submit" className={secondaryButton}>
              Add
            </button>
          </form>
          {error && (
            <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        aria-expanded={showHistory}
        onClick={() => setShowHistory((v) => !v)}
        className="flex min-h-11 items-center gap-1 text-sm font-medium text-amber-800 dark:text-amber-400"
      >
        <ChevronDown size={16} className={showHistory ? 'rotate-180' : ''} aria-hidden /> History ({history.length})
      </button>
      {showHistory && (
        <ul className="divide-y divide-stone-200 dark:divide-stone-800">
          {history.map((c) => (
            <li key={c.id} className="flex items-center gap-2 py-1">
              <p className="flex-1 text-sm">
                {formatMoney(c.amount, currency)} <span className={mutedText}>· {formatDate(c.date)}</span>
              </p>
              <button type="button" aria-label={`Remove ${formatMoney(c.amount, currency)} from ${formatDate(c.date)}`} className={`${iconButton} text-red-700 dark:text-red-400`} onClick={() => void deleteContribution(c.id)}>
                <Trash2 size={16} aria-hidden />
              </button>
            </li>
          ))}
          {history.length === 0 && <li className={`py-2 text-sm ${mutedText}`}>No contributions yet.</li>}
        </ul>
      )}
    </li>
  )
}
