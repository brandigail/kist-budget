import { db, newId, nowISO } from '../../db/schema'
import type { Goal } from '../../types'

export interface GoalInput {
  name: string
  target: number
  deadline?: string
}

export async function addGoal(input: GoalInput): Promise<string> {
  const id = newId()
  await db.goals.add({ id, name: input.name, target: input.target, deadline: input.deadline, saved: 0, updatedAt: nowISO() })
  return id
}

export async function updateGoal(id: string, input: GoalInput): Promise<void> {
  await db.goals.update(id, { name: input.name, target: input.target, deadline: input.deadline, updatedAt: nowISO() })
}

export async function deleteGoal(id: string): Promise<void> {
  const stamp = nowISO()
  await db.goals.update(id, { deletedAt: stamp, updatedAt: stamp })
}

/** Records the money and raises `saved` in one transaction, so the two can never disagree. */
export async function addContribution(goalId: string, amount: number, date: string): Promise<void> {
  await db.transaction('rw', [db.goals, db.contributions], async () => {
    const goal: Goal | undefined = await db.goals.get(goalId)
    if (!goal || goal.deletedAt) return
    const stamp = nowISO()
    await db.contributions.add({ id: newId(), goalId, amount, date, updatedAt: stamp })
    await db.goals.update(goalId, { saved: goal.saved + amount, updatedAt: stamp })
  })
}

export async function deleteContribution(id: string): Promise<void> {
  await db.transaction('rw', [db.goals, db.contributions], async () => {
    const contribution = await db.contributions.get(id)
    if (!contribution) return
    const goal = await db.goals.get(contribution.goalId)
    await db.contributions.delete(id)
    if (goal) await db.goals.update(goal.id, { saved: Math.max(0, goal.saved - contribution.amount), updatedAt: nowISO() })
  })
}
