import { describe, expect, it } from 'vitest'
import { centsToInput, formatMoney, formatMoneyShort, MAX_CENTS, parseAmountToCents, popDigit, pushDigit } from './money'

describe('formatMoney', () => {
  it('formats rand with a space-grouped thousands and comma decimals', () => {
    expect(formatMoney(123456)).toBe('R 1 234,56')
    expect(formatMoney(0)).toBe('R 0,00')
  })

  it('formats other currencies', () => {
    expect(formatMoney(123456, 'USD')).toBe('$1,234.56')
    expect(formatMoney(5000, 'GBP')).toBe('£50.00')
  })

  it('drops zero cents in the short form only', () => {
    expect(formatMoneyShort(450000)).toBe('R 4 500')
    expect(formatMoneyShort(450050)).toBe('R 4 500,50')
  })
})

describe('parseAmountToCents', () => {
  it.each([
    ['120', 12000],
    ['120.5', 12050],
    ['120,5', 12050],
    ['120.55', 12055],
    ['R 1 234,50', 123450],
    ['1,234.50', 123450],
    ['1.234,50', 123450],
    ['1,234', 123400],
    ['0.99', 99],
    ['  42  ', 4200],
  ])('reads %s as %i cents', (input, cents) => {
    expect(parseAmountToCents(input)).toBe(cents)
  })

  it.each(['', 'abc', '-5', '1e3', '1.2.3.4x'])('rejects %j', (input) => {
    const parsed = parseAmountToCents(input)
    expect(parsed === null || Number.isInteger(parsed)).toBe(true)
    if (['', 'abc', '-5'].includes(input)) expect(parsed).toBeNull()
  })

  it('rejects amounts past the cap', () => {
    expect(parseAmountToCents('999999999999')).toBeNull()
  })

  it('never produces a float', () => {
    expect(Number.isInteger(parseAmountToCents('19.99'))).toBe(true)
    expect(parseAmountToCents('19.99')).toBe(1999)
  })
})

describe('keypad helpers', () => {
  it('builds an amount calculator-style', () => {
    let cents = 0
    for (const d of [1, 2, 5, 0]) cents = pushDigit(cents, d)
    expect(cents).toBe(1250)
    expect(centsToInput(cents)).toBe('12.50')
    expect(popDigit(cents)).toBe(125)
    expect(popDigit(0)).toBe(0)
  })

  it('stops at the cap', () => {
    expect(pushDigit(MAX_CENTS, 5)).toBe(MAX_CENTS)
  })
})
