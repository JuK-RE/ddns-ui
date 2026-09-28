import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import { useTheme, type Theme } from './theme-context'
import './ThemeToggle.css'

const OPTIONS: { value: Theme; label: string; Icon: LucideIcon }[] = [
  { value: 'light', label: 'Tema claro', Icon: Sun },
  { value: 'system', label: 'Tema do sistema', Icon: Monitor },
  { value: 'dark', label: 'Tema escuro', Icon: Moon },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="theme-toggle" role="group" aria-label="Tema">
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          className="theme-toggle-btn"
          aria-label={label}
          title={label}
          aria-pressed={theme === value}
          onClick={() => setTheme(value)}
        >
          <Icon size={14} strokeWidth={2} />
        </button>
      ))}
    </div>
  )
}

/**
 * Um ícone só (sol/lua) que alterna entre claro e escuro, pra headers
 * compactos (ex.: topo dos docs). Parte do tema resolvido, então funciona
 * também quando a preferência está em "sistema".
 */
export function ThemeIconButton({ className = '' }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const next = resolvedTheme === 'dark' ? 'light' : 'dark'
  const label = next === 'dark' ? 'Mudar para o tema escuro' : 'Mudar para o tema claro'
  const Icon = resolvedTheme === 'dark' ? Sun : Moon

  return (
    <button type="button" className={`theme-icon-btn ${className}`} aria-label={label} title={label} onClick={() => setTheme(next)}>
      <Icon size={16} strokeWidth={2} />
    </button>
  )
}
