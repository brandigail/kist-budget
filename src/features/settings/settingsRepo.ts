import { db } from '../../db/schema'
import { createBackup } from '../../lib/backup'
import type { BackupFile, CurrencyCode } from '../../types'

const CURRENCY_KEY = 'currency'

export function isCurrency(value: string | undefined): value is CurrencyCode {
  return value === 'ZAR' || value === 'USD' || value === 'EUR' || value === 'GBP'
}

export async function setCurrency(code: CurrencyCode): Promise<void> {
  await db.settings.put({ key: CURRENCY_KEY, value: code })
}

export async function getCurrency(): Promise<CurrencyCode> {
  const row = await db.settings.get(CURRENCY_KEY)
  return isCurrency(row?.value) ? row.value : 'ZAR'
}

export async function exportAll(): Promise<BackupFile> {
  const [categories, expenses, goals, contributions] = await Promise.all([
    db.categories.toArray(),
    db.expenses.toArray(),
    db.goals.toArray(),
    db.contributions.toArray(),
  ])
  return createBackup({ categories, expenses, goals, contributions })
}

/** Replaces everything with the backup, all or nothing. The caller has already validated it. */
export async function importAll(backup: BackupFile): Promise<void> {
  await db.transaction('rw', [db.categories, db.expenses, db.goals, db.contributions], async () => {
    await Promise.all([db.categories.clear(), db.expenses.clear(), db.goals.clear(), db.contributions.clear()])
    await db.categories.bulkAdd(backup.categories)
    await db.expenses.bulkAdd(backup.expenses)
    await db.goals.bulkAdd(backup.goals)
    await db.contributions.bulkAdd(backup.contributions)
  })
}

export async function wipeAll(): Promise<void> {
  await db.transaction('rw', [db.categories, db.expenses, db.goals, db.contributions], async () => {
    await Promise.all([db.categories.clear(), db.expenses.clear(), db.goals.clear(), db.contributions.clear()])
  })
}
