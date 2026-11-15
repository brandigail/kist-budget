import { useState, type FormEvent } from 'react'
import { inputClass, primaryButton, secondaryButton } from '../../components/ui'
import { isValidISO, todayISO } from '../../lib/dates'
import { centsToInput, parseAmountToCents } from '../../lib/money'
import type { Goal } from '../../types'
import type { GoalInput } from './goalRepo'

interface Props {
  initial?: Goal
  onSubmit: (input: GoalInput) => Promise<void>
  onCancel: () => void
}

export function GoalForm({ initial, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [target, setTarget] = useState(initial ? centsToInput(initial.target) : '')
  const [deadline, setDeadline] = useState(initial?.deadline ?? '')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const cents = parseAmountToCents(target)
    if (!name.trim()) return setError('Give the goal a name.')
    if (cents === null || cents <= 0) return setError('Enter a target amount above zero.')
    if (deadline && (!isValidISO(deadline) || deadline < todayISO())) return setError('The deadline should be today or later, or left empty.')
    setError(null)
    await onSubmit({ name: name.trim(), target: cents, deadline: deadline || undefined })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <label className="block text-sm font-medium">
        Goal name
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Emergency fund" maxLength={60} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-medium">
          Target amount
          <input className={inputClass} inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="0.00" />
        </label>
        <label className="block text-sm font-medium">
          Deadline (optional)
          <input className={inputClass} type="date" min={todayISO()} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </label>
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit" className={primaryButton}>
          {initial ? 'Save changes' : 'Add goal'}
        </button>
        <button type="button" className={secondaryButton} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
