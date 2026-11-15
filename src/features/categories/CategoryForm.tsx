import { useState, type FormEvent } from 'react'
import { inputClass, primaryButton, secondaryButton } from '../../components/ui'
import { centsToInput, parseAmountToCents } from '../../lib/money'
import type { Category } from '../../types'
import { CATEGORY_COLORS } from './categoryColors'
import type { CategoryInput } from './categoryRepo'

interface Props {
  initial?: Category
  onSubmit: (input: CategoryInput) => Promise<void>
  onCancel: () => void
}

export function CategoryForm({ initial, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [limit, setLimit] = useState(initial && initial.monthlyLimit > 0 ? centsToInput(initial.monthlyLimit) : '')
  const [color, setColor] = useState(initial?.color ?? CATEGORY_COLORS[0])
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const cents = limit.trim() === '' ? 0 : parseAmountToCents(limit)
    if (!name.trim()) return setError('Give the category a name.')
    if (cents === null) return setError('Enter the monthly limit as an amount, or leave it empty for no limit.')
    setError(null)
    await onSubmit({ name: name.trim(), monthlyLimit: cents, color })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <label className="block text-sm font-medium">
        Name
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Groceries" maxLength={60} />
      </label>
      <label className="block text-sm font-medium">
        Monthly limit (optional)
        <input className={inputClass} inputMode="decimal" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="No limit" />
      </label>
      <fieldset>
        <legend className="text-sm font-medium">Colour</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {CATEGORY_COLORS.map((c) => (
            <label key={c} className={`flex size-11 items-center justify-center rounded-full border-2 ${color === c ? 'border-stone-900 dark:border-white' : 'border-transparent'}`}>
              <input type="radio" name="color" value={c} checked={color === c} onChange={() => setColor(c)} className="sr-only" aria-label={`Colour ${c}`} />
              <span className="size-7 rounded-full" style={{ background: c }} aria-hidden />
            </label>
          ))}
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit" className={primaryButton}>
          {initial ? 'Save changes' : 'Add category'}
        </button>
        <button type="button" className={secondaryButton} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
