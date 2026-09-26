import { useAuth } from '../auth/AuthContext'

/**
 * Bolinha de status da API. Não faz requisição própria: aproveita o
 * /auth/me que o AuthProvider já chama ao carregar — se ele falhou por
 * rede/servidor, a API está fora.
 */
export function ApiStatus() {
  const { loading, lastError } = useAuth()

  const state = loading ? 'checking' : lastError ? 'down' : 'up'
  const label = {
    checking: 'Verificando status…',
    down: 'API indisponível',
    up: 'Todos os sistemas operacionais',
  }[state]

  return (
    <span className={`ui-status ui-status--${state}`} role="status">
      <span className="ui-status-dot" aria-hidden="true" />
      {label}
    </span>
  )
}
