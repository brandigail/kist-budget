import type { CurrencyCode } from '../types'

export const CURRENCIES: { code: CurrencyCode; label: string; locale: string }[] = [
  { code: 'ZAR', label: 'South African rand (R)', locale: 'en-ZA' },
  { code: 'USD', label: 'US dollar ($)', locale: 'en-US' },
  { code: 'EUR', label: 'Euro (€)', locale: 'en-IE' },
  { code: 'GBP', label: 'British pound (£)', locale: 'en-GB' },
]

export const MAX_CENTS = 99_999_999_99

/** Money is stored as integer cents and only formatted for display. */
export function formatMoney(cents: number, currency: CurrencyCode = 'ZAR'): string {
  const entry = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0]
  const text = new Intl.NumberFormat(entry.locale, { style: 'currency', currency }).format(cents / 100)
  return text.replace(/ /g, ' ')
}

/** Whole-currency variant used where cents are noise, for example budget limits. */
export function formatMoneyShort(cents: number, currency: CurrencyCode = 'ZAR'): string {
  const entry = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0]
  const fractionDigits = cents % 100 === 0 ? 0 : 2
  const text = new Intl.NumberFormat(entry.locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(cents / 100)
  return text.replace(/ /g, ' ')
}

/**
 * Parses what a person typed ("R 1 234,50", "12.5", "300") into integer cents.
 * Returns null for anything that isn't a plain non-negative amount.
 */
export function parseAmountToCents(text: string): number | null {
  const cleaned = text.replace(/[^\d.,-]/g, '')
  if (cleaned === '' || cleaned.startsWith('-')) return null
  const lastSeparator = Math.max(cleaned.lastIndexOf(','), cleaned.lastIndexOf('.'))
  let whole = cleaned
  let fraction = ''
  // A trailing separator followed by 1 or 2 digits is the decimal point; otherwise separators are grouping.
  if (lastSeparator !== -1 && cleaned.length - lastSeparator - 1 <= 2 && cleaned.length - lastSeparator - 1 > 0) {
    whole = cleaned.slice(0, lastSeparator)
    fraction = cleaned.slice(lastSeparator + 1)
  }
  const digits = whole.replace(/[.,]/g, '')
  if (!/^\d+$/.test(digits || '0')) return null
  const cents = Number(digits || '0') * 100 + Number(fraction.padEnd(2, '0') || '0')
  return cents > MAX_CENTS ? null : cents
}

/** Plain editable text for a cents value, e.g. 123450 becomes "1234.50". */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2)
}

/** Keypad entry: each digit shifts the amount left, so 1, 2, 5, 0 reads as 12.50. Capped at MAX_CENTS. */
export function pushDigit(cents: number, digit: number): number {
  const next = cents * 10 + digit
  return next > MAX_CENTS ? cents : next
}

export function popDigit(cents: number): number {
  return Math.floor(cents / 10)
}
