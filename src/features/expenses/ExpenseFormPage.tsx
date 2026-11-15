import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AmountKeypad } from '../../components/AmountKeypad'
import { cardClass, dangerText, inputClass, mutedText, primaryButton, secondaryButton } from '../../components/ui'
import { db } from '../../db/schema'
import { isValidISO, todayISO } from '../../lib/dates'
import { useCurrency } from '../settings/useCurrency'
import { addExpense, deleteExpense, updateExpense } from './expenseRepo'
import type { Expense } from '../../types'

/** Add (`/add`) and edit (`/expenses/:id`) share this screen. */
export function ExpenseFormPage() {
  const { id } = useParams()
  const existing = useLiveQuery(() => (id ? db.expenses.get(id) : undefined), [id])
  if (id && existing === undefined) return <p className={mutedText}>Loading…</p>
  if (id && (!existing || existing.deletedAt)) {
    return (
      <section className={`${cardClass} space-y-3 text-center`}>
        <p className="font-medium">That expense no longer exists.</p>
        <Link to="/expenses" className={secondaryButton}>Back to expenses</Link>
      </section>
    )
  }
  return <ExpenseForm key={id ?? 'new'} existing={existing ?? undefined} />
}

function ExpenseForm({ existing }: { existing?: Expense }) {
  const navigate = useNavigate()
  const currency = useCurrency()
  const categories = useLiveQuery(() => db.categories.toArray())
  const [cents, setCents] = useState(existing?.amount ?? 0)
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? '')
  const [date, setDate] = useState(existing?.date ?? todayISO())
  const [note, setNote] = useState(existing?.note ?? '')
  const [error, setError] = useState<string | null>(null)

  const active = (categories ?? []).filter((c) => !c.deletedAt).sort((a, b) => a.name.localeCompare(b.name))
  const chosen = categoryId || active[0]?.id || ''

  async function save(e: FormEvent) {
    e.preventDefault()
    if (cents <= 0) return setError('Enter an amount above zero.')
    if (!chosen) return setError('Pick a category. Add one on the Budget screen first.')
    if (!isValidISO(date) || date > todayISO()) return setError('Enter a date that is today or earlier.')
    setError(null)
    const input = { categoryId: chosen, amount: cents, date, note: note.trim() }
    if (existing) await updateExpense(existing.id, input)
    else await addExpense(input)
    navigate('/expenses')
  }

  async function remove() {
    if (!existing || !window.confirm('Delete this expense?')) return
    await deleteExpense(existing.id)
    navigate('/expenses')
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="flex items-center gap-2">
        <Link to="/expenses" aria-label="Back to expenses" className="flex size-11 items-center justify-center rounded-full hover:bg-stone-100 dark:hover:bg-stone-800">
          <ArrowLeft size={22} aria-hidden />
        </Link>
        <h2 className="text-xl font-semibold">{existing ? 'Edit expense' : 'Add expense'}</h2>
      </div>

      <div className={cardClass}>
        <AmountKeypad cents={cents} onChange={setCents} currency={currency} />
      </div>

      <fieldset className={cardClass}>
        <legend className="px-1 text-sm font-medium">Category</legend>
        {active.length === 0 ? (
          <p className={`text-sm ${mutedText}`}>
            No categories yet. <Link to="/budget" className="font-medium underline">Add one</Link> first.
          </p>
        ) : (
          <div className="mt-1 flex flex-wrap gap-2">
            {active.map((c) => (
              <label
                key={c.id}
                className={`flex min-h-11 items-center gap-2 rounded-full border px-3 text-sm font-medium ${
                  chosen === c.id ? 'border-amber-700 bg-amber-50 dark:bg-amber-950' : 'border-stone-300 dark:border-stone-700'
                }`}
              >
                <input type="radio" name="category" value={c.id} checked={chosen === c.id} onChange={() => setCategoryId(c.id)} className="sr-only" />
                <span className="size-3 rounded-full" style={{ background: c.color }} aria-hidden />
                {c.name}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <div className={`${cardClass} grid gap-3 sm:grid-cols-2`}>
        <label className="block text-sm font-medium">
          Date
          <input className={inputClass} type="date" max={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="block text-sm font-medium">
          Note (optional)
          <input className={inputClass} maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Weekly shop" />
        </label>
      </div>

      {error && (
        <p role="alert" className={`text-sm font-medium ${dangerText}`}>
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit" className={`${primaryButton} flex-1`}>
          {existing ? 'Save changes' : 'Save expense'}
        </button>
        {existing && (
          <button type="button" className={`${secondaryButton} ${dangerText}`} onClick={() => void remove()}>
            Delete
          </button>
        )}
      </div>
    </form>
  )
}
