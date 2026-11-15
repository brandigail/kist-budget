import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/schema'
import type { CurrencyCode } from '../../types'
import { isCurrency } from './settingsRepo'

/** The chosen currency, read from the local database like everything else. ZAR until the user changes it. */
export function useCurrency(): CurrencyCode {
  const row = useLiveQuery(() => db.settings.get('currency'))
  return isCurrency(row?.value) ? row.value : 'ZAR'
}
