import { useCallback, useEffect, useState } from 'react'
import { api, getCurrentSessionId } from '../lib/api'
import { useAuth } from '../auth/AuthContext'
import type { Session } from '../types'

function statusOf(session: Session): 'ativa' | 'revogada' | 'expirada' {
  if (session.revoked_at) return 'revogada'
  if (new Date(session.expires_at).getTime() < Date.now()) return 'expirada'
  return 'ativa'
}

// Lista as sessões (dispositivos/logins) do usuário e permite "deslogar
// remotamente" qualquer uma delas — revoga no backend (DELETE
// /auth/sessions/:id), que é o que de fato invalida aquele token antes
// de expirar (ver services/session.ts na API).
export function SessionsPanel() {
  const { user, logout } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [error, setError] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [revokingAll, setRevokingAll] = useState(false)
  const currentSessionId = getCurrentSessionId()

  const load = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await api.get<{ sessions: Session[] }>('/auth/sessions')
      setSessions(data.sessions)
    } catch {
      setError('Erro ao carregar sessões')
    }
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  async function handleRevoke(session: Session) {
    setError(null)
    setRevokingId(session.id)

    try {
      await api.delete(`/auth/sessions/${session.id}`)

      if (session.id === currentSessionId) {
        // Era a sessão deste próprio dispositivo — desloga localmente
        // também, já que o token guardado não serve mais.
        await logout()
      }

      await load()
    } catch (err) {
      const data = (err as { response?: { data?: { error?: string } } }).response?.data
      setError(data?.error ?? 'Erro ao revogar sessão')
    } finally {
      setRevokingId(null)
    }
  }

  // Desconecta todos os dispositivos de uma vez — inclui a sessão atual,
  // por isso desloga localmente logo em seguida (o token guardado deixa
  // de servir assim que o backend confirma).
  async function handleRevokeAll() {
    setError(null)
    setRevokingAll(true)

    try {
      await api.delete('/auth/sessions')
      await logout()
    } catch (err) {
      const data = (err as { response?: { data?: { error?: string } } }).response?.data
      setError(data?.error ?? 'Erro ao desconectar todos os dispositivos')
    } finally {
      setRevokingAll(false)
    }
  }

  if (!user) return null

  const hasActiveSession = sessions.some((session) => statusOf(session) === 'ativa')

  return (
    <section className="sessions-panel">
      <div className="sessions-panel-header">
        <h2>Sessões</h2>
        {hasActiveSession && (
          <button type="button" className="danger" onClick={() => void handleRevokeAll()} disabled={revokingAll}>
            {revokingAll ? 'Desconectando…' : 'Desconectar todos os dispositivos'}
          </button>
        )}
      </div>

      {error && <p className="error">{error}</p>}

      <ul className="sessions-list">
        {sessions.length === 0 && <li className="empty">Nenhuma sessão encontrada.</li>}
        {sessions.map((session) => {
          const status = statusOf(session)
          const isCurrent = session.id === currentSessionId

          return (
            <li key={session.id}>
              <span className="session-provider">{session.provider}</span>
              {isCurrent && <span className="session-badge">este dispositivo</span>}
              <span className={`session-status session-status--${status}`}>{status}</span>
              <time>{new Date(session.created_at).toLocaleString('pt-BR')}</time>
              {status === 'ativa' && (
                <button
                  type="button"
                  onClick={() => void handleRevoke(session)}
                  disabled={revokingId === session.id}
                >
                  {isCurrent ? 'Sair' : 'Deslogar remotamente'}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
