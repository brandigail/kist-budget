import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { currentMonth, shiftMonth } from '../lib/dates'
import { MonthContext } from './month'

export function MonthProvider({ children }: { children: ReactNode }) {
  const [month, setMonth] = useState(currentMonth)
  const previous = useCallback(() => setMonth((m) => shiftMonth(m, -1)), [])
  const next = useCallback(() => setMonth((m) => shiftMonth(m, 1)), [])
  const isCurrent = month === currentMonth()
  const value = useMemo(() => ({ month, setMonth, previous, next, isCurrent }), [month, previous, next, isCurrent])
  return <MonthContext.Provider value={value}>{children}</MonthContext.Provider>
}
