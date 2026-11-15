import { Delete } from 'lucide-react'
import { formatMoney, popDigit, pushDigit } from '../lib/money'
import type { CurrencyCode } from '../types'

interface Props {
  /** Integer cents. */
  cents: number
  onChange: (cents: number) => void
  currency: CurrencyCode
}

const KEYS: (number | 'clear' | 'back')[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'clear', 0, 'back']

const keyClass =
  'flex h-14 items-center justify-center rounded-xl border border-stone-200 bg-white text-xl font-semibold transition-colors hover:bg-stone-100 active:bg-stone-200 dark:border-stone-700 dark:bg-stone-900 dark:hover:bg-stone-800 dark:active:bg-stone-700'

/**
 * A big numeric pad so amounts are fast to enter one-handed. Digits shift in from the right like a
 * till, so 1, 2, 5, 0 reads 12.50. There is no floating point anywhere: the value is integer cents.
 */
export function AmountKeypad({ cents, onChange, currency }: Props) {
  return (
    <div>
      <p className="py-3 text-center text-4xl font-bold tabular-nums" role="status" aria-label={`Amount ${formatMoney(cents, currency)}`}>
        {formatMoney(cents, currency)}
      </p>
      <div className="grid grid-cols-3 gap-2" role="group" aria-label="Amount keypad">
        {KEYS.map((key) => {
          if (key === 'clear') {
            return (
              <button key="clear" type="button" className={`${keyClass} text-base`} onClick={() => onChange(0)}>
                Clear
              </button>
            )
          }
          if (key === 'back') {
            return (
              <button key="back" type="button" className={keyClass} aria-label="Delete last digit" onClick={() => onChange(popDigit(cents))}>
                <Delete size={22} aria-hidden />
              </button>
            )
          }
          return (
            <button key={key} type="button" className={keyClass} onClick={() => onChange(pushDigit(cents, key))}>
              {key}
            </button>
          )
        })}
      </div>
    </div>
  )
}
