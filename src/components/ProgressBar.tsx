interface Props {
  /** 0 to 100 or more; the bar fills to 100 and turns red when over. */
  percent: number
  label: string
  color?: string
  over?: boolean
}

export function ProgressBar({ percent, label, color = '#b45309', over = false }: Props) {
  const clamped = Math.max(0, Math.min(100, percent))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      className="h-2.5 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800"
    >
      <div className="h-full rounded-full transition-[width]" style={{ width: `${clamped}%`, background: over ? '#b91c1c' : color }} />
    </div>
  )
}
