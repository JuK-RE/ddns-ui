import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { hasSessionHint } from '../lib/api'
import { consumeRedirectAfterLogin, rememberRedirectAfterLogin } from './redirect'
import { AdminLayout } from '../pages/admin/AdminLayout'
import { LandingPage } from '../pages/LandingPage'
import './guards.css'

type AuthStatus = 'checking' | 'authenticated' | 'anonymous'

// Só mostra o loader quando este navegador tem uma sessão aberta (dica em
// localStorage — o cookie é httpOnly e o JS não enxerga) e ainda estamos
// confirmando no /auth/me. Sem a dica, já renderiza como visitante — evita
// um spinner à toa na primeira visita à landing.
function useAuthStatus(): AuthStatus {
  const { user, loading } = useAuth()
  if (user) return 'authenticated'
  if (loading && hasSessionHint()) return 'checking'
  return 'anonymous'
}

export function FullScreenLoader() {
  return (
    <div className="full-loader" role="status" aria-live="polite">
      <span className="full-loader-spinner" aria-hidden="true" />
      <span className="sr-only">Carregando…</span>
    </div>
  )
}

/**
 * Porta de entrada do "/" e das rotas do painel.
 *
 * - Logado: renderiza o layout do admin (as páginas entram pelo <Outlet />).
 * - Visitante no "/": mostra a landing page.
 * - Visitante em qualquer rota do painel (/sessions, /versions…): manda pro
 *   /auth, guardando pra onde ele queria ir — depois do login ele volta pra lá.
 */
export function RootGate() {
  const status = useAuthStatus()
  const location = useLocation()

  if (status === 'checking') return <FullScreenLoader />
  if (status === 'authenticated') return <AdminLayout />

  if (location.pathname === '/') return <LandingPage />

  rememberRedirectAfterLogin(location.pathname + location.search)
  return <Navigate to="/auth" replace />
}

/** Rotas só pra visitante (ex.: /auth). Logado → volta pro painel. */
export function GuestOnly() {
  const status = useAuthStatus()

  if (status === 'checking') return <FullScreenLoader />
  if (status === 'authenticated') return <Navigate to={consumeRedirectAfterLogin() ?? '/'} replace />

  return <Outlet />
}

/** Rotas só de administrador (ex.: /versions). Usuário comum volta pro painel. */
export function AdminOnly() {
  const { user } = useAuth()
  if (!user?.is_admin) return <Navigate to="/" replace />
  return <Outlet />
}
