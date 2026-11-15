import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

const OFFLINE_NOTICE_MS = 6000

/**
 * Shown when a new version is waiting (the user decides when to reload) or once the app is ready to work offline.
 * It sits at the top so it can never cover a save button, and the offline notice goes away by itself.
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW()

  useEffect(() => {
    if (!offlineReady) return
    const timer = window.setTimeout(() => setOfflineReady(false), OFFLINE_NOTICE_MS)
    return () => window.clearTimeout(timer)
  }, [offlineReady, setOfflineReady])

  if (!needRefresh && !offlineReady) return null

  return (
    <div
      role="status"
      className="fixed inset-x-3 top-16 z-30 mx-auto flex max-w-md items-center gap-3 rounded-xl border border-amber-200 bg-white p-3 text-sm shadow-lg dark:border-amber-900 dark:bg-stone-900"
    >
      <p className="flex-1">{needRefresh ? 'A new version of Kist is ready.' : 'Kist now works offline.'}</p>
      {needRefresh && (
        <button
          type="button"
          onClick={() => void updateServiceWorker(true)}
          className="min-h-11 rounded-lg bg-amber-700 px-3 font-medium text-white hover:bg-amber-800"
        >
          Reload
        </button>
      )}
      <button
        type="button"
        onClick={() => {
          setNeedRefresh(false)
          setOfflineReady(false)
        }}
        className="min-h-11 rounded-lg border border-stone-300 px-3 font-medium hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
      >
        Dismiss
      </button>
    </div>
  )
}
