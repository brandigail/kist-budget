import type { Category, Expense } from '../types'
import { monthOf } from './dates'

export interface CategoryRow {
  category: Category
  spent: number
  /** Cents; 0 means no limit was set. */
  limit: number
  /** Limit minus spent (negative when over). Meaningless when `limit` is 0. */
  remaining: number
  /** Share of the limit used, 0 when there is no limit. Not capped at 100. */
  percent: number
  over: boolean
  /** True for a deleted or unknown category that still has spending this month. */
  removed: boolean
}

export interface MonthSummary {
  rows: CategoryRow[]
  totalSpent: number
  totalBudget: number
  remaining: number
  percent: number
  expenseCount: number
}

const REMOVED_COLOR = '#78716c'

/**
 * Spent versus budget per category for one `YYYY-MM` month. Deleted expenses are ignored.
 * A category that was deleted (or is missing after an import) but still has spending that month
 * appears as a "removed" row, so the monthly total always matches the expense list.
 */
export function summarizeMonth(categories: readonly Category[], expenses: readonly Expense[], month: string): MonthSummary {
  const live = expenses.filter((e) => !e.deletedAt && monthOf(e.date) === month)
  const spentBy = new Map<string, number>()
  for (const e of live) spentBy.set(e.categoryId, (spentBy.get(e.categoryId) ?? 0) + e.amount)

  const active = categories.filter((c) => !c.deletedAt).sort((a, b) => a.name.localeCompare(b.name))
  const rows: CategoryRow[] = active.map((category) => {
    const spent = spentBy.get(category.id) ?? 0
    const limit = category.monthlyLimit
    return {
      category,
      spent,
      limit,
      remaining: limit - spent,
      percent: limit > 0 ? (spent / limit) * 100 : 0,
      over: limit > 0 && spent > limit,
      removed: false,
    }
  })

  const known = new Set(active.map((c) => c.id))
  for (const [categoryId, spent] of spentBy) {
    if (known.has(categoryId)) continue
    const deleted = categories.find((c) => c.id === categoryId)
    const category: Category = deleted ?? {
      id: categoryId,
      name: 'Unknown category',
      monthlyLimit: 0,
      color: REMOVED_COLOR,
      updatedAt: '',
    }
    rows.push({ category, spent, limit: 0, remaining: 0, percent: 0, over: false, removed: true })
  }

  const totalSpent = live.reduce((sum, e) => sum + e.amount, 0)
  const totalBudget = active.reduce((sum, c) => sum + c.monthlyLimit, 0)
  return {
    rows,
    totalSpent,
    totalBudget,
    remaining: totalBudget - totalSpent,
    percent: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
    expenseCount: live.length,
  }
}

export interface DayGroup {
  date: string
  total: number
  expenses: Expense[]
}

/** Newest day first, newest entry first within a day. */
export function groupByDay(expenses: readonly Expense[]): DayGroup[] {
  const byDate = new Map<string, Expense[]>()
  for (const e of expenses) byDate.set(e.date, [...(byDate.get(e.date) ?? []), e])
  return [...byDate.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, list]) => ({
      date,
      total: list.reduce((sum, e) => sum + e.amount, 0),
      expenses: [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    }))
}

export function liveExpensesInMonth(expenses: readonly Expense[], month: string): Expense[] {
  return expenses.filter((e) => !e.deletedAt && monthOf(e.date) === month)
}
