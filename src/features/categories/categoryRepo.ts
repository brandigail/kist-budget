import { db, newId, nowISO } from '../../db/schema'
import type { Category } from '../../types'

export type CategoryInput = Pick<Category, 'name' | 'monthlyLimit' | 'color'>

export async function addCategory(input: CategoryInput): Promise<string> {
  const id = newId()
  await db.categories.add({ id, ...input, updatedAt: nowISO() })
  return id
}

export async function updateCategory(id: string, input: CategoryInput): Promise<void> {
  await db.categories.update(id, { ...input, updatedAt: nowISO() })
}

/**
 * Soft delete: the row stays (with `deletedAt`) so past months still add up and a future sync
 * can propagate the deletion. Its expenses are kept.
 */
export async function deleteCategory(id: string): Promise<void> {
  const stamp = nowISO()
  await db.categories.update(id, { deletedAt: stamp, updatedAt: stamp })
}
