import type { Goal } from '../types'
import { monthOf, monthsBetween } from './dates'

export interface GoalProgress {
  /** 0 to 100, capped. */
  percent: number
  /** Cents still to save (never negative). */
  remaining: number
  completed: boolean
  /** Deadline month has passed and the goal is not complete. */
  overdue: boolean
  /** Whole months left including this one; null without a deadline or once complete or overdue. */
  monthsLeft: number | null
  /** Cents to put aside each month to land on the deadline; null when not applicable. */
  perMonthNeeded: number | null
}

export function goalProgress(goal: Goal, today: string): GoalProgress {
  const remaining = Math.max(0, goal.target - goal.saved)
  const completed = goal.target > 0 && goal.saved >= goal.target
  const percent = goal.target > 0 ? Math.min(100, (goal.saved / goal.target) * 100) : 0

  let monthsLeft: number | null = null
  let overdue = false
  if (goal.deadline && !completed) {
    const gap = monthsBetween(monthOf(today), monthOf(goal.deadline))
    if (gap < 0) overdue = true
    else monthsLeft = gap + 1
  }

  return {
    percent,
    remaining,
    completed,
    overdue,
    monthsLeft,
    perMonthNeeded: monthsLeft !== null && remaining > 0 ? Math.ceil(remaining / monthsLeft) : null,
  }
}
