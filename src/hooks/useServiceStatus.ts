import { useAuth } from '../auth/AuthContext'

export type ServiceState = 'operational' | 'degraded' | 'downtime' | 'maintenance'

// Página de status pública. Pode ser trocada com VITE_STATUS_PAGE_URL no .env.
export const STATUS_PAGE_URL =
  (import.meta.env.VITE_STATUS_PAGE_URL as string | undefined) || 'https://status.jucasoft.com.br/'

/**
 * Status do serviço pro <StatusBadge />.
 *
 * Hoje é derivado da chamada ao /auth/me que o AuthProvider já faz ao
 * carregar (sem requisição extra): respondeu → operacional; falhou →
 * indisponível. `degraded`/`maintenance` ficam prontos no tipo pra quando
 * existir uma página/API de status de verdade — aí é só trocar a fonte aqui.
 */
export function useServiceStatus(): { state: ServiceState | null; loading: boolean } {
  const { loading, lastError } = useAuth()

  if (loading) return { state: null, loading: true }
  return { state: lastError ? 'downtime' : 'operational', loading: false }
}
