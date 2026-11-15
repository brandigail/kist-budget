import { Download, Trash2, Upload } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { cardClass, inputClass, mutedText, secondaryButton } from '../../components/ui'
import { seedDemoData } from '../../db/seedDemo'
import { db } from '../../db/schema'
import { parseBackup } from '../../lib/backup'
import { todayISO } from '../../lib/dates'
import { CURRENCIES } from '../../lib/money'
import { useCurrency } from './useCurrency'
import { exportAll, importAll, isCurrency, setCurrency, wipeAll } from './settingsRepo'

export function SettingsPage() {
  const currency = useCurrency()
  const fileInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  async function download() {
    const backup = await exportAll()
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `kist-backup-${todayISO()}.json`
    link.click()
    URL.revokeObjectURL(url)
    setMessage({ kind: 'ok', text: `Saved ${backup.expenses.length} expenses, ${backup.goals.length} goals and ${backup.categories.length} categories.` })
  }

  async function restore(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const parsed = parseBackup(await file.text())
    if (!parsed.ok) return setMessage({ kind: 'error', text: parsed.error })
    const { backup } = parsed
    if (!window.confirm(`Replace everything on this device with the backup (${backup.expenses.length} expenses, ${backup.goals.length} goals)?`)) return
    await importAll(backup)
    setMessage({ kind: 'ok', text: 'Backup restored.' })
  }

  async function clearEverything() {
    if (!window.confirm('Delete every category, expense and goal on this device? Export a backup first if you might want them back.')) return
    await wipeAll()
    setMessage({ kind: 'ok', text: 'All data removed.' })
  }

  async function loadDemo() {
    if ((await db.categories.count()) > 0 && !window.confirm('This adds the demo household next to your existing data. Continue?')) return
    await seedDemoData()
    setMessage({ kind: 'ok', text: 'Demo household added.' })
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Settings</h2>

      <div className={cardClass}>
        <label className="block text-sm font-medium">
          Currency
          <select className={inputClass} value={currency} onChange={(e) => isCurrency(e.target.value) && void setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <p className={`mt-2 text-sm ${mutedText}`}>Only changes how amounts are shown. Nothing is converted.</p>
      </div>

      <div className={`${cardClass} space-y-3`}>
        <h3 className="font-semibold">Backup</h3>
        <p className={`text-sm ${mutedText}`}>Your data lives only on this device. Save a backup file to keep it safe or move to another phone.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={secondaryButton} onClick={() => void download()}>
            <Download size={16} aria-hidden /> Export backup
          </button>
          <button type="button" className={secondaryButton} onClick={() => fileInput.current?.click()}>
            <Upload size={16} aria-hidden /> Import backup
          </button>
          <input ref={fileInput} type="file" accept="application/json,.json" className="sr-only" onChange={(e) => void restore(e)} aria-label="Backup file" tabIndex={-1} />
        </div>
      </div>

      <div className={`${cardClass} space-y-3`}>
        <h3 className="font-semibold">Data</h3>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={secondaryButton} onClick={() => void loadDemo()}>
            Load demo household
          </button>
          <button type="button" className={`${secondaryButton} text-red-700 dark:text-red-400`} onClick={() => void clearEverything()}>
            <Trash2 size={16} aria-hidden /> Delete all data
          </button>
        </div>
      </div>

      {message && (
        <p role="status" className={`text-sm font-medium ${message.kind === 'error' ? 'text-red-700 dark:text-red-400' : 'text-green-800 dark:text-green-400'}`}>
          {message.text}
        </p>
      )}
    </section>
  )
}
