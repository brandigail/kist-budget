import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../providers/theme'
import { iconButton } from './ui'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <button type="button" onClick={toggleTheme} aria-label={`Switch to ${next} theme`} className={iconButton}>
      {theme === 'dark' ? <Sun size={20} aria-hidden /> : <Moon size={20} aria-hidden />}
    </button>
  )
}
