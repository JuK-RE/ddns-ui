import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react'
import { api, API_URL, setSessionHint } from '../lib/api'
import type { User } from '../types'

type AuthContextValue = {
  user: User | null
  loading: boolean
  lastError: string | null
  /** Erro vindo do retorno do OAuth (?login=error). */
  loginError: boolean
  refresh: () => Promise<void>
  logout: () => Promise<void>
  loginUrl: string
  loginUrlGoogle: string
}

const AuthContext = createContext<AuthContextValue | null>(null)

// O backend devolve o navegador pra /auth?login=success (ou =error) depois
// do OAuth — o token já veio num cookie httpOnly, nada vem na URL. Lemos o
// parâmetro antes do primeiro render (pra já mostrar "carregando" em vez da
// tela de login) e limpamos a URL.
function consumeLoginResult(): 'success' | 'error' | null {
  const params = new URLSearchParams(window.location.search)
  const result = params.get('login')
  if (result !== 'success' && result !== 'error') return null

  params.delete('login')
  const query = params.toString()
  window.history.replaceState(null, '', window.location.pathname + (query ? `?${query}` : '') + window.location.hash)

  if (result === 'success') setSessionHint(true)
  return result
}
const initialLoginResult = consumeLoginResult()

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastError, setLastError] = useState<string | null>(null)
  const [loginError] = useState(initialLoginResult === 'error')

  const refresh = useCallback(async () => {
    setLoading(true)
    setLastError(null)
    try {
      const { data } = await api.get<{ user: User | null }>('/auth/me')
      setUser(data.user)
      setSessionHint(Boolean(data.user))
    } catch (err) {
      setUser(null)
      setLastError(err instanceof Error ? err.message : 'Erro ao verificar sessão')
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      // POST: o backend revoga a sessão e apaga o cookie httpOnly (o JS não
      // consegue apagar esse cookie sozinho).
      await api.post('/auth/logout')
    } catch {
      // não crítico — a UI sai do modo logado de qualquer forma
    } finally {
      setSessionHint(false)
      setUser(null)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        lastError,
        loginError,
        refresh,
        logout,
        loginUrl: `${API_URL}/auth/github`,
        loginUrlGoogle: `${API_URL}/auth/google`,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
