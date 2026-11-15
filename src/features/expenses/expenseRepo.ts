import { db, newId, nowISO } from '../../db/schema'
import type { Expense } from '../../types'

export type ExpenseInput = Pick<Expense, 'categoryId' | 'amount' | 'date' | 'note'>

export async function addExpense(input: ExpenseInput): Promise<string> {
  const id = newId()
  await db.expenses.add({ id, ...input, updatedAt: nowISO() })
  return id
}

export async function updateExpense(id: string, input: ExpenseInput): Promise<void> {
  await db.expenses.update(id, { ...input, updatedAt: nowISO() })
}

export async function deleteExpense(id: string): Promise<void> {
  const stamp = nowISO()
  await db.expenses.update(id, { deletedAt: stamp, updatedAt: stamp })
}

/** Undo for a just-deleted expense. */
export async function restoreExpense(id: string): Promise<void> {
  await db.expenses.update(id, { deletedAt: undefined, updatedAt: nowISO() })
}
