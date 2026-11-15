import { z } from 'zod'
import type { BackupFile, Category, Contribution, Expense, Goal } from '../types'
import { isValidISO } from './dates'
import { MAX_CENTS } from './money'

const cents = z.number().int().min(0).max(MAX_CENTS)
const day = z.string().refine(isValidISO, 'Expected a YYYY-MM-DD date')
const stamp = z.string().min(1).max(40)

const categorySchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().trim().min(1).max(60),
  monthlyLimit: cents,
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  updatedAt: stamp,
  deletedAt: stamp.optional(),
})

const expenseSchema = z.object({
  id: z.string().min(1).max(64),
  categoryId: z.string().min(1).max(64),
  amount: cents,
  date: day,
  note: z.string().max(200),
  updatedAt: stamp,
  deletedAt: stamp.optional(),
})

const goalSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().trim().min(1).max(60),
  target: cents,
  saved: cents,
  deadline: day.optional(),
  updatedAt: stamp,
  deletedAt: stamp.optional(),
})

const contributionSchema = z.object({
  id: z.string().min(1).max(64),
  goalId: z.string().min(1).max(64),
  amount: cents,
  date: day,
  updatedAt: stamp,
})

const backupSchema = z.object({
  app: z.literal('kist'),
  version: z.literal(1),
  exportedAt: stamp,
  categories: z.array(categorySchema).max(500),
  expenses: z.array(expenseSchema).max(50_000),
  goals: z.array(goalSchema).max(500),
  contributions: z.array(contributionSchema).max(50_000),
})

export function createBackup(data: {
  categories: Category[]
  expenses: Expense[]
  goals: Goal[]
  contributions: Contribution[]
}): BackupFile {
  return { app: 'kist', version: 1, exportedAt: new Date().toISOString(), ...data }
}

export type ParsedBackup = { ok: true; backup: BackupFile } | { ok: false; error: string }

/** Validates a backup file before anything in the database is touched. */
export function parseBackup(text: string): ParsedBackup {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' }
  }
  const result = backupSchema.safeParse(json)
  if (!result.success) {
    const issue = result.error.issues[0]
    const where = issue.path.length ? ` (${issue.path.join('.')})` : ''
    return { ok: false, error: `That does not look like a Kist backup${where}.` }
  }
  return { ok: true, backup: result.data as BackupFile }
}
