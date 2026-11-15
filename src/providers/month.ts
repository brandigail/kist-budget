import { createContext, useContext } from 'react'

export interface MonthContextValue {
  /** `YYYY-MM`, shared by the dashboard and the expense list so they never disagree. */
  month: string
  setMonth: (month: string) => void
  previous: () => void
  next: () => void
  isCurrent: boolean
}

export const MonthContext = createContext<MonthContextValue | null>(null)

export function useMonth(): MonthContextValue {
  const ctx = useContext(MonthContext)
  if (!ctx) throw new Error('useMonth must be used within MonthProvider')
  return ctx
}
