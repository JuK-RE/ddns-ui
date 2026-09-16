import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react'
import { api, API_URL, setToken, clearToken } from '../lib/api'
import type { User } from '../types'

type AuthContextValue = {
  user: User | null
  loading: boolean
  lastError: string | null
  refresh: () => Promise<void>
  logout: () => Promise<void>
  loginUrl: string
  loginUrlGoogle: string
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastError, setLastError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setLastError(null)
    try {
      const { data } = await api.get<{ user: User | null }>('/auth/me')
      setUser(data.user)
    } catch (err) {
      setUser(null)
      setLastError(err instanceof Error ? err.message : 'Erro ao verificar sessão')
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      // Precisa ir com o header Authorization ainda presente — é assim
      // que o backend sabe qual sessão revogar. Por isso chama a API
      // antes de limpar o token local (na ordem antiga, o token já
      // tinha sido descartado e o backend não tinha como saber qual
      // sessão revogar).
      await api.get('/auth/logout')
    } catch {
      // não crítico — mesmo falhando, ainda descartamos o token local abaixo
    } finally {
      clearToken()
      setUser(null)
    }
  }, [])

  useEffect(() => {
    // O redirect do GitHub volta com "#token=..." na URL. Extrai, salva
    // e limpa a URL antes de fazer qualquer outra coisa.
    const hash = window.location.hash
    if (hash.startsWith('#token=')) {
      const token = decodeURIComponent(hash.slice('#token='.length))
      setToken(token)
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }

    refresh()
  }, [refresh])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        lastError,
        refresh,
        logout,
        loginUrl: `${API_URL ?? ''}/auth/github`,
        loginUrlGoogle: `${API_URL ?? ''}/auth/google`,
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
