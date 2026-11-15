import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { buildDemoData, seedDemoData } from '../../db/seedDemo'
import { db } from '../../db/schema'
import { parseBackup } from '../../lib/backup'
import { summarizeMonth } from '../../lib/budget'
import { monthOf, shiftMonth, todayISO } from '../../lib/dates'
import { addCategory, deleteCategory } from '../categories/categoryRepo'
import { addExpense, deleteExpense, restoreExpense, updateExpense } from '../expenses/expenseRepo'
import { addContribution, addGoal, deleteContribution } from '../goals/goalRepo'
import { exportAll, getCurrency, importAll, setCurrency, wipeAll } from './settingsRepo'

beforeEach(async () => {
  await Promise.all([db.categories.clear(), db.expenses.clear(), db.goals.clear(), db.contributions.clear(), db.settings.clear()])
})

describe('expense and category repos (offline, soft deletes)', () => {
  it('soft-deletes an expense and can restore it', async () => {
    const category = await addCategory({ name: 'Groceries', monthlyLimit: 500000, color: '#15803d' })
    const id = await addExpense({ categoryId: category, amount: 12000, date: '2025-03-02', note: 'Shop' })
    await deleteExpense(id)
    expect((await db.expenses.get(id))?.deletedAt).toBeTruthy()
    await restoreExpense(id)
    expect((await db.expenses.get(id))?.deletedAt).toBeUndefined()
  })

  it('stamps updatedAt on every change (needed for last-write-wins sync later)', async () => {
    const category = await addCategory({ name: 'Fun', monthlyLimit: 0, color: '#be123c' })
    const id = await addExpense({ categoryId: category, amount: 100, date: '2025-03-02', note: '' })
    const first = (await db.expenses.get(id))!.updatedAt
    await new Promise((r) => setTimeout(r, 5))
    await updateExpense(id, { categoryId: category, amount: 200, date: '2025-03-02', note: 'x' })
    expect((await db.expenses.get(id))!.updatedAt > first).toBe(true)
  })

  it('keeps past spending visible after its category is deleted', async () => {
    const category = await addCategory({ name: 'Old gym', monthlyLimit: 30000, color: '#7c3aed' })
    await addExpense({ categoryId: category, amount: 30000, date: '2025-03-03', note: '' })
    await deleteCategory(category)
    const summary = summarizeMonth(await db.categories.toArray(), await db.expenses.toArray(), '2025-03')
    expect(summary.totalSpent).toBe(30000)
    expect(summary.rows[0].removed).toBe(true)
  })
})

describe('goals', () => {
  it('keeps saved equal to the sum of contributions through add and delete', async () => {
    const goalId = await addGoal({ name: 'Holiday', target: 1000000 })
    await addContribution(goalId, 50000, '2025-03-01')
    await addContribution(goalId, 25000, '2025-03-08')
    expect((await db.goals.get(goalId))?.saved).toBe(75000)
    const [first] = await db.contributions.toArray()
    await deleteContribution(first.id)
    const goal = await db.goals.get(goalId)
    const sum = (await db.contributions.where('goalId').equals(goalId).toArray()).reduce((s, c) => s + c.amount, 0)
    expect(goal?.saved).toBe(sum)
  })

  it('ignores contributions to a missing goal', async () => {
    await addContribution('nope', 100, '2025-03-01')
    expect(await db.contributions.count()).toBe(0)
  })
})

describe('settings, backup and demo data', () => {
  it('defaults the currency to ZAR and remembers a change', async () => {
    expect(await getCurrency()).toBe('ZAR')
    await setCurrency('GBP')
    expect(await getCurrency()).toBe('GBP')
  })

  it('exports then restores everything, including soft-deleted rows', async () => {
    await seedDemoData()
    const [expense] = await db.expenses.toArray()
    await deleteExpense(expense.id)
    const before = { expenses: await db.expenses.count(), goals: await db.goals.count() }
    const parsed = parseBackup(JSON.stringify(await exportAll()))
    expect(parsed.ok).toBe(true)
    await wipeAll()
    expect(await db.expenses.count()).toBe(0)
    if (parsed.ok) await importAll(parsed.backup)
    expect(await db.expenses.count()).toBe(before.expenses)
    expect(await db.goals.count()).toBe(before.goals)
    expect((await db.expenses.get(expense.id))?.deletedAt).toBeTruthy()
  })

  it('builds believable demo data that is deterministic apart from ids', () => {
    const data = buildDemoData(todayISO())
    const month = monthOf(todayISO())
    const last = summarizeMonth(data.categories, data.expenses, shiftMonth(month, -1))
    expect(data.categories.length).toBe(7)
    expect(last.totalSpent).toBeGreaterThan(1_500_000) // more than R15 000
    expect(last.rows.some((r) => r.over)).toBe(true) // one category is in the red
    expect(data.goals.some((g) => g.saved >= g.target)).toBe(true)
    for (const g of data.goals) {
      const sum = data.contributions.filter((c) => c.goalId === g.id).reduce((s, c) => s + c.amount, 0)
      expect(g.saved).toBe(sum)
    }
    const strip = (d: typeof data) => d.expenses.map(({ id: _i, categoryId: _c, ...rest }) => rest)
    expect(strip(buildDemoData(todayISO()))).toEqual(strip(data))
  })
})
