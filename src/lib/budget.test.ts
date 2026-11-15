import { describe, expect, it } from 'vitest'
import type { Category, Contribution, Expense, Goal } from '../types'
import { createBackup, parseBackup } from './backup'
import { groupByDay, summarizeMonth } from './budget'
import { addDays, currentMonth, formatMonth, isValidISO, monthsBetween, shiftMonth } from './dates'
import { goalProgress } from './goals'

const cat = (id: string, name: string, monthlyLimit: number, deletedAt?: string): Category => ({
  id,
  name,
  monthlyLimit,
  color: '#b45309',
  updatedAt: '2025-01-01T00:00:00.000Z',
  deletedAt,
})
let n = 0
const exp = (categoryId: string, amount: number, date: string, deletedAt?: string): Expense => ({
  id: `e${n++}`,
  categoryId,
  amount,
  date,
  note: '',
  updatedAt: `2025-01-01T00:00:${String(n).padStart(2, '0')}.000Z`,
  deletedAt,
})

describe('dates', () => {
  it('shifts months across year boundaries', () => {
    expect(shiftMonth('2025-01', -1)).toBe('2024-12')
    expect(shiftMonth('2025-12', 1)).toBe('2026-01')
    expect(shiftMonth('2025-03', 14)).toBe('2026-05')
  })

  it('counts months between and formats them', () => {
    expect(monthsBetween('2025-11', '2026-02')).toBe(3)
    expect(monthsBetween('2025-05', '2025-02')).toBe(-3)
    expect(formatMonth('2025-03')).toBe('March 2025')
    expect(currentMonth()).toMatch(/^\d{4}-\d{2}$/)
  })

  it('validates dates', () => {
    expect(isValidISO('2024-02-29')).toBe(true)
    expect(isValidISO('2025-02-29')).toBe(false)
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01')
  })
})

describe('summarizeMonth', () => {
  const food = cat('food', 'Groceries', 500000)
  const fun = cat('fun', 'Fun', 0)

  it('totals spent against each limit and flags overspend', () => {
    const s = summarizeMonth([food, fun], [exp('food', 300000, '2025-03-02'), exp('food', 250000, '2025-03-20'), exp('fun', 9900, '2025-03-05')], '2025-03')
    const groceries = s.rows.find((r) => r.category.id === 'food')!
    expect(groceries.spent).toBe(550000)
    expect(groceries.remaining).toBe(-50000)
    expect(groceries.over).toBe(true)
    expect(groceries.percent).toBeCloseTo(110, 5)
    expect(s.totalSpent).toBe(559900)
    expect(s.totalBudget).toBe(500000)
    expect(s.expenseCount).toBe(3)
  })

  it('never flags a category with no limit as over', () => {
    const row = summarizeMonth([fun], [exp('fun', 99999, '2025-03-05')], '2025-03').rows[0]
    expect(row.over).toBe(false)
    expect(row.percent).toBe(0)
  })

  it('only counts the chosen month and ignores deleted expenses', () => {
    const s = summarizeMonth([food], [exp('food', 1000, '2025-03-31'), exp('food', 2000, '2025-04-01'), exp('food', 4000, '2025-03-10', '2025-03-11')], '2025-03')
    expect(s.totalSpent).toBe(1000)
  })

  it('keeps spending from a deleted category visible so totals still add up', () => {
    const gone = cat('gone', 'Old gym', 30000, '2025-02-01T00:00:00.000Z')
    const s = summarizeMonth([food, gone], [exp('gone', 30000, '2025-03-03'), exp('ghost', 5000, '2025-03-04')], '2025-03')
    expect(s.rows.filter((r) => r.removed).map((r) => r.category.name)).toEqual(['Old gym', 'Unknown category'])
    expect(s.totalSpent).toBe(35000)
    expect(s.totalBudget).toBe(500000) // a deleted category no longer adds to the budget
  })

  it('handles an empty month', () => {
    const s = summarizeMonth([food], [], '2025-03')
    expect(s.totalSpent).toBe(0)
    expect(s.percent).toBe(0)
  })
})

describe('groupByDay', () => {
  it('orders days newest first and totals each day', () => {
    const groups = groupByDay([exp('a', 100, '2025-03-01'), exp('a', 200, '2025-03-03'), exp('a', 300, '2025-03-03')])
    expect(groups.map((g) => g.date)).toEqual(['2025-03-03', '2025-03-01'])
    expect(groups[0].total).toBe(500)
  })
})

describe('goalProgress', () => {
  const goal = (over: Partial<Goal> = {}): Goal => ({ id: 'g', name: 'Holiday', target: 1200000, saved: 300000, updatedAt: '', ...over })

  it('computes percent and what is left', () => {
    const p = goalProgress(goal(), '2025-03-10')
    expect(p.percent).toBe(25)
    expect(p.remaining).toBe(900000)
    expect(p.completed).toBe(false)
    expect(p.perMonthNeeded).toBeNull()
  })

  it('works out the monthly amount to land on the deadline, counting this month', () => {
    const p = goalProgress(goal({ deadline: '2025-08-31' }), '2025-03-10') // Mar..Aug = 6 months
    expect(p.monthsLeft).toBe(6)
    expect(p.perMonthNeeded).toBe(150000)
  })

  it('rounds the monthly amount up to a whole cent', () => {
    expect(goalProgress(goal({ saved: 0, target: 1000, deadline: '2025-05-31' }), '2025-03-01').perMonthNeeded).toBe(334)
  })

  it('treats a passed deadline as overdue and a full goal as complete', () => {
    expect(goalProgress(goal({ deadline: '2025-01-31' }), '2025-03-10').overdue).toBe(true)
    const done = goalProgress(goal({ saved: 1300000, deadline: '2025-01-31' }), '2025-03-10')
    expect(done.completed).toBe(true)
    expect(done.percent).toBe(100)
    expect(done.overdue).toBe(false)
    expect(done.remaining).toBe(0)
  })

  it('never divides by a zero target', () => {
    expect(goalProgress(goal({ target: 0, saved: 0 }), '2025-03-10').percent).toBe(0)
  })
})

describe('backup', () => {
  const data = {
    categories: [cat('food', 'Groceries', 500000)],
    expenses: [exp('food', 12345, '2025-03-02')],
    goals: [{ id: 'g', name: 'Holiday', target: 1000000, saved: 0, updatedAt: '2025-01-01T00:00:00.000Z' } satisfies Goal],
    contributions: [] as Contribution[],
  }

  it('round-trips through JSON', () => {
    const parsed = parseBackup(JSON.stringify(createBackup(data)))
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.backup.expenses[0].amount).toBe(12345)
  })

  it.each([
    ['not json', 'valid JSON'],
    [JSON.stringify({ app: 'other', version: 1 }), 'Kist backup'],
    [JSON.stringify({ ...createBackup(data), expenses: [{ ...data.expenses[0], amount: 1.5 }] }), 'expenses'],
    [JSON.stringify({ ...createBackup(data), expenses: [{ ...data.expenses[0], date: '2025-13-40' }] }), 'expenses'],
    [JSON.stringify({ ...createBackup(data), categories: [{ ...data.categories[0], color: 'red' }] }), 'categories'],
  ])('rejects bad input %#', (text, mention) => {
    const parsed = parseBackup(text)
    expect(parsed.ok).toBe(false)
    if (!parsed.ok) expect(parsed.error).toContain(mention)
  })
})
