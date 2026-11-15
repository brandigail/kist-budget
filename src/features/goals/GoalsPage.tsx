import { useLiveQuery } from 'dexie-react-hooks'
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cardClass, mutedText, primaryButton } from '../../components/ui'
import { db } from '../../db/schema'
import { useCurrency } from '../settings/useCurrency'
import type { Goal } from '../../types'
import { GoalCard } from './GoalCard'
import { GoalForm } from './GoalForm'
import { addGoal, deleteGoal, updateGoal, type GoalInput } from './goalRepo'

type Mode = { kind: 'list' } | { kind: 'add' } | { kind: 'edit'; goal: Goal }

export function GoalsPage() {
  const currency = useCurrency()
  const [mode, setMode] = useState<Mode>({ kind: 'list' })
  const goals = useLiveQuery(() => db.goals.toArray())

  const visible = useMemo(
    () =>
      (goals ?? [])
        .filter((g) => !g.deletedAt)
        // Unfinished goals first, so the ones to work on are on top.
        .sort((a, b) => Number(a.saved >= a.target) - Number(b.saved >= b.target) || a.name.localeCompare(b.name)),
    [goals],
  )

  async function save(input: GoalInput) {
    if (mode.kind === 'edit') await updateGoal(mode.goal.id, input)
    else await addGoal(input)
    setMode({ kind: 'list' })
  }

  async function remove(goal: Goal) {
    if (window.confirm(`Delete "${goal.name}" and its history?`)) await deleteGoal(goal.id)
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Savings goals</h2>
        {mode.kind === 'list' && (
          <button type="button" className={primaryButton} onClick={() => setMode({ kind: 'add' })}>
            <Plus size={16} aria-hidden /> New goal
          </button>
        )}
      </div>

      {mode.kind !== 'list' && (
        <GoalForm
          key={mode.kind === 'edit' ? mode.goal.id : 'new'}
          initial={mode.kind === 'edit' ? mode.goal : undefined}
          onSubmit={save}
          onCancel={() => setMode({ kind: 'list' })}
        />
      )}

      {goals && visible.length === 0 && mode.kind === 'list' && (
        <div className={`${cardClass} text-center`}>
          <p className="font-medium">No goals yet</p>
          <p className={`text-sm ${mutedText}`}>Create one, then top it up whenever you put money aside.</p>
        </div>
      )}

      <ul className="space-y-4">
        {visible.map((goal) => (
          <GoalCard key={goal.id} goal={goal} currency={currency} onEdit={() => setMode({ kind: 'edit', goal })} onDelete={() => void remove(goal)} />
        ))}
      </ul>
    </section>
  )
}
