import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Theme = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'ddns_theme'

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    // sem storage (modo privado, etc.) — usa o default
  }
  return 'system'
}

function systemPrefersDark() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
}

function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : theme
}

function applyResolvedTheme(resolved: ResolvedTheme) {
  document.documentElement.setAttribute('data-theme', resolved)
}

type ThemeContextValue = {
  /** Preferência escolhida pelo usuário: 'light' | 'dark' | 'system'. */
  theme: Theme
  /** Tema efetivamente aplicado (resolve 'system' pra 'light'/'dark'). */
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

// Provider do tema (claro/escuro/sistema). O valor escolhido vai pro
// localStorage e é aplicado como atributo `data-theme` na <html> — o CSS
// (ver :root[data-theme='dark'] em index.css) faz o resto.
//
// Pra não piscar o tema errado no primeiro paint, um script inline no
// index.html já aplica o `data-theme` antes do React montar; aqui a gente só
// mantém esse estado em sincronia com o React e com mudanças do sistema.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme)
  // Só existe pra forçar um recálculo quando o SO muda de tema com a
  // preferência em 'system' — o valor em si não é usado em lugar nenhum.
  const [systemTick, setSystemTick] = useState(0)

  // eslint-disable-next-line react-hooks/exhaustive-deps -- systemTick só serve pra forçar o recálculo abaixo
  const resolvedTheme = useMemo(() => resolveTheme(theme), [theme, systemTick])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // sem storage — só não lembra a preferência entre visitas
    }
  }, [])

  // Sincroniza o `data-theme` da <html> (sistema externo ao React) sempre
  // que o tema resolvido mudar.
  useEffect(() => {
    applyResolvedTheme(resolvedTheme)
  }, [resolvedTheme])

  // Tema 'system': acompanha a preferência do SO em tempo real, sem precisar
  // recarregar a página.
  useEffect(() => {
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setSystemTick((tick) => tick + 1)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme])

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme precisa estar dentro de <ThemeProvider>')
  return ctx
}
