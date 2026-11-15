import Dexie, { type EntityTable } from 'dexie'
import type { Category, Contribution, Expense, Goal, SettingRecord } from '../types'

/**
 * The only source of truth for the UI. Nothing in the render path ever touches the network:
 * screens read with `useLiveQuery` and write through the repos.
 */
export class KistDB extends Dexie {
  categories!: EntityTable<Category, 'id'>
  expenses!: EntityTable<Expense, 'id'>
  goals!: EntityTable<Goal, 'id'>
  contributions!: EntityTable<Contribution, 'id'>
  settings!: EntityTable<SettingRecord, 'key'>

  constructor(name = 'kist') {
    super(name)
    // Add a new `this.version(n)` block for every schema change; never edit a shipped one.
    this.version(1).stores({
      categories: 'id, name, updatedAt',
      expenses: 'id, categoryId, date, updatedAt, [categoryId+date]',
      goals: 'id, updatedAt',
      contributions: 'id, goalId, date',
      settings: 'key',
    })
  }
}

export const db = new KistDB()

export const newId = (): string => crypto.randomUUID()
export const nowISO = (): string => new Date().toISOString()
