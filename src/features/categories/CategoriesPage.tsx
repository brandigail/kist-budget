import { useLiveQuery } from 'dexie-react-hooks'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cardClass, iconButton, mutedText, primaryButton } from '../../components/ui'
import { db } from '../../db/schema'
import { formatMoney } from '../../lib/money'
import type { Category } from '../../types'
import { useCurrency } from '../settings/useCurrency'
import { CategoryForm } from './CategoryForm'
import { addCategory, deleteCategory, updateCategory, type CategoryInput } from './categoryRepo'

type Mode = { kind: 'list' } | { kind: 'add' } | { kind: 'edit'; category: Category }

export function CategoriesPage() {
  const currency = useCurrency()
  const [mode, setMode] = useState<Mode>({ kind: 'list' })
  const categories = useLiveQuery(() => db.categories.toArray())

  const active = useMemo(() => (categories ?? []).filter((c) => !c.deletedAt).sort((a, b) => a.name.localeCompare(b.name)), [categories])
  const totalBudget = active.reduce((sum, c) => sum + c.monthlyLimit, 0)

  async function save(input: CategoryInput) {
    if (mode.kind === 'edit') await updateCategory(mode.category.id, input)
    else await addCategory(input)
    setMode({ kind: 'list' })
  }

  async function remove(category: Category) {
    const ok = window.confirm(`Delete "${category.name}"? Expenses already logged against it are kept.`)
    if (ok) await deleteCategory(category.id)
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Monthly budget</h2>
        {mode.kind === 'list' && (
          <button type="button" className={primaryButton} onClick={() => setMode({ kind: 'add' })}>
            <Plus size={16} aria-hidden /> Category
          </button>
        )}
      </div>
      <p className={`text-sm ${mutedText}`}>
        Total budget: <span className="font-semibold text-stone-900 dark:text-stone-100">{formatMoney(totalBudget, currency)}</span> a month
      </p>

      {mode.kind !== 'list' && (
        <CategoryForm
          key={mode.kind === 'edit' ? mode.category.id : 'new'}
          initial={mode.kind === 'edit' ? mode.category : undefined}
          onSubmit={save}
          onCancel={() => setMode({ kind: 'list' })}
        />
      )}

      {categories && active.length === 0 && mode.kind === 'list' && (
        <div className={`${cardClass} text-center`}>
          <p className="font-medium">No categories yet</p>
          <p className={`text-sm ${mutedText}`}>Add groceries, rent and so on, each with a monthly limit.</p>
        </div>
      )}

      <ul className="space-y-2">
        {active.map((c) => (
          <li key={c.id} className={`${cardClass} flex items-center gap-2 !p-2 !pl-3`}>
            <span className="size-4 shrink-0 rounded-full" style={{ background: c.color }} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{c.name}</p>
              <p className={`text-sm tabular-nums ${mutedText}`}>{c.monthlyLimit > 0 ? `${formatMoney(c.monthlyLimit, currency)} a month` : 'No limit'}</p>
            </div>
            <button type="button" aria-label={`Edit ${c.name}`} className={iconButton} onClick={() => setMode({ kind: 'edit', category: c })}>
              <Pencil size={18} aria-hidden />
            </button>
            <button type="button" aria-label={`Delete ${c.name}`} className={`${iconButton} text-red-700 dark:text-red-400`} onClick={() => void remove(c)}>
              <Trash2 size={18} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
