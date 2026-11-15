/**
 * Dates are ISO `YYYY-MM-DD` strings; `updatedAt` / `deletedAt` are ISO timestamps.
 * Money is always integer cents. Every record carries `updatedAt` and a soft-delete `deletedAt`
 * so the data is ready for last-write-wins sync (Phase 2) without a migration.
 */

export interface Category {
  id: string
  name: string
  /** Cents per month. 0 means "no limit set". */
  monthlyLimit: number
  color: string
  updatedAt: string
  deletedAt?: string
}

export interface Expense {
  id: string
  categoryId: string
  /** Cents. */
  amount: number
  date: string
  note: string
  updatedAt: string
  deletedAt?: string
}

export interface Goal {
  id: string
  name: string
  /** Cents. */
  target: number
  /** Cents; always equals the sum of the goal's contributions. */
  saved: number
  deadline?: string
  updatedAt: string
  deletedAt?: string
}

export interface Contribution {
  id: string
  goalId: string
  /** Cents. */
  amount: number
  date: string
  updatedAt: string
}

export type CurrencyCode = 'ZAR' | 'USD' | 'EUR' | 'GBP'

export interface SettingRecord {
  key: string
  value: string
}

export interface BackupFile {
  app: 'kist'
  version: 1
  exportedAt: string
  categories: Category[]
  expenses: Expense[]
  goals: Goal[]
  contributions: Contribution[]
}
