import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatMonth } from '../lib/dates'
import { useMonth } from '../providers/month'
import { iconButton } from './ui'

export function MonthSwitcher() {
  const { month, previous, next, isCurrent } = useMonth()
  return (
    <div className="flex items-center justify-between">
      <button type="button" onClick={previous} aria-label="Previous month" className={iconButton}>
        <ChevronLeft size={22} aria-hidden />
      </button>
      <h2 className="text-lg font-semibold" aria-live="polite">
        {formatMonth(month)}
      </h2>
      <button type="button" onClick={next} disabled={isCurrent} aria-label="Next month" className={`${iconButton} disabled:opacity-30`}>
        <ChevronRight size={22} aria-hidden />
      </button>
    </div>
  )
}
