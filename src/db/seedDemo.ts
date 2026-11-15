import { addDays, monthOf, shiftMonth, todayISO } from '../lib/dates'
import type { Category, Contribution, Expense, Goal } from '../types'
import { db, newId } from './schema'

/** Small deterministic generator so the demo looks the same every time (and tests can rely on it). */
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const STAMP = '2025-01-01T08:00:00.000Z'

interface CategorySeed {
  key: string
  name: string
  limitRand: number
  color: string
}

const CATEGORY_SEEDS: CategorySeed[] = [
  { key: 'rent', name: 'Rent', limitRand: 8500, color: '#b45309' },
  { key: 'groceries', name: 'Groceries', limitRand: 4500, color: '#15803d' },
  { key: 'transport', name: 'Transport', limitRand: 1800, color: '#1d4ed8' },
  { key: 'utilities', name: 'Utilities', limitRand: 2300, color: '#7c3aed' },
  { key: 'airtime', name: 'Airtime and data', limitRand: 600, color: '#0e7490' },
  { key: 'eating', name: 'Eating out', limitRand: 900, color: '#be123c' },
  { key: 'savings', name: 'Savings', limitRand: 1500, color: '#4d7c0f' },
]

interface Recurring {
  category: string
  note: string
  /** Day of month. */
  day: number
  /** Rand; the seed varies it slightly unless `fixed`. */
  rand: number
  fixed?: boolean
}

const MONTHLY: Recurring[] = [
  { category: 'rent', note: 'Rent', day: 1, rand: 8500, fixed: true },
  { category: 'utilities', note: 'Fibre internet', day: 3, rand: 899, fixed: true },
  { category: 'utilities', note: 'Prepaid electricity', day: 6, rand: 600 },
  { category: 'utilities', note: 'Prepaid electricity', day: 19, rand: 550 },
  { category: 'utilities', note: 'Water and refuse', day: 12, rand: 280 },
  { category: 'airtime', note: 'Data bundle', day: 4, rand: 299, fixed: true },
  { category: 'airtime', note: 'Airtime top-up', day: 17, rand: 120 },
  { category: 'savings', note: 'Transfer to savings', day: 25, rand: 1500, fixed: true },
  { category: 'transport', note: 'Petrol', day: 5, rand: 650 },
  { category: 'transport', note: 'Petrol', day: 15, rand: 600 },
  { category: 'transport', note: 'Uber home', day: 21, rand: 180 },
  { category: 'groceries', note: 'Weekly shop', day: 2, rand: 1050 },
  { category: 'groceries', note: 'Weekly shop', day: 9, rand: 920 },
  { category: 'groceries', note: 'Weekly shop', day: 16, rand: 980 },
  { category: 'groceries', note: 'Weekly shop', day: 23, rand: 900 },
  { category: 'groceries', note: 'Butcher and veg', day: 27, rand: 420 },
  { category: 'eating', note: 'Takeaways', day: 8, rand: 240 },
  { category: 'eating', note: 'Coffee with friends', day: 14, rand: 130 },
  { category: 'eating', note: 'Dinner out', day: 22, rand: 410 },
]

export interface DemoData {
  categories: Category[]
  expenses: Expense[]
  goals: Goal[]
  contributions: Contribution[]
}

/** Builds three months of household history ending today, without touching the database. */
export function buildDemoData(today: string = todayISO()): DemoData {
  const rand = mulberry32(7)
  const idByKey = new Map<string, string>()
  const categories: Category[] = CATEGORY_SEEDS.map((seed) => {
    const id = newId()
    idByKey.set(seed.key, id)
    return { id, name: seed.name, monthlyLimit: seed.limitRand * 100, color: seed.color, updatedAt: STAMP }
  })

  const thisMonth = monthOf(today)
  const expenses: Expense[] = []
  for (const month of [shiftMonth(thisMonth, -2), shiftMonth(thisMonth, -1), thisMonth]) {
    for (const item of MONTHLY) {
      const date = `${month}-${String(item.day).padStart(2, '0')}`
      if (date > today) continue
      const jitter = item.fixed ? 1 : 0.88 + rand() * 0.28
      const cents = Math.round((item.rand * jitter) / 5) * 5 * 100
      expenses.push({
        id: newId(),
        categoryId: idByKey.get(item.category) ?? '',
        amount: cents,
        date,
        note: item.note,
        updatedAt: `${date}T09:00:00.000Z`,
      })
    }
  }

  // One honest overspend last month so the dashboard shows a category in the red.
  const lastMonthEnd = `${shiftMonth(thisMonth, -1)}-28`
  expenses.push({
    id: newId(),
    categoryId: idByKey.get('groceries') ?? '',
    amount: 95000,
    date: lastMonthEnd,
    note: 'Month-end stock-up',
    updatedAt: `${lastMonthEnd}T18:00:00.000Z`,
  })

  const goals: Goal[] = []
  const contributions: Contribution[] = []
  const addGoal = (name: string, targetRand: number, deadline: string | undefined, gifts: number[]) => {
    const id = newId()
    gifts.forEach((rands, i) => {
      const date = addDays(today, -(gifts.length - i) * 30)
      contributions.push({ id: newId(), goalId: id, amount: rands * 100, date, updatedAt: `${date}T10:00:00.000Z` })
    })
    goals.push({
      id,
      name,
      target: targetRand * 100,
      saved: gifts.reduce((sum, r) => sum + r * 100, 0),
      deadline,
      updatedAt: STAMP,
    })
  }
  addGoal('Emergency fund', 30000, addDays(today, 270), [2500, 2500, 2500, 2500, 2400])
  addGoal('Cape Town holiday', 12000, addDays(today, 120), [2000, 1500, 2500, 1500])
  addGoal('New laptop', 15000, undefined, [5000, 5000, 5000])

  return { categories, expenses, goals, contributions }
}

/** Adds the demo household and returns nothing; call only when the database is empty. */
export async function seedDemoData(): Promise<void> {
  const data = buildDemoData()
  await db.transaction('rw', [db.categories, db.expenses, db.goals, db.contributions], async () => {
    await db.categories.bulkAdd(data.categories)
    await db.expenses.bulkAdd(data.expenses)
    await db.goals.bulkAdd(data.goals)
    await db.contributions.bulkAdd(data.contributions)
  })
}

const SEEDED_KEY = 'kist-demo-seeded'

/** First launch only, so the app looks alive. Never comes back after the user clears their data. */
export async function ensureDemoData(): Promise<void> {
  try {
    if (localStorage.getItem(SEEDED_KEY)) return
    localStorage.setItem(SEEDED_KEY, '1')
  } catch {
    return
  }
  if ((await db.categories.count()) > 0) return
  await seedDemoData()
}
