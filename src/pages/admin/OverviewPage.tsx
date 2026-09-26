import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Globe, History, MonitorSmartphone } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { api } from '../../lib/api'
import { getAvatarUrl } from '../../lib/avatar'
import type { Session } from '../../types'
import { IconBadge } from '../../ui'
import { PageHeader } from './PageHeader'

type Version = { id: number; version: string; description: string | null; created_at: string }

function countActive(sessions: Session[]) {
  const now = Date.now()
  return sessions.filter((s) => !s.revoked_at && new Date(s.expires_at).getTime() > now).length
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function OverviewPage() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<{ total: number; active: number } | null>(null)
  const [hello] = useState(greeting)
  const [versions, setVersions] = useState<Version[] | null>(null)

  useEffect(() => {
    let cancelled = false
    api
      .get<{ sessions: Session[] }>('/auth/sessions')
      .then(({ data }) => !cancelled && setSessions({ total: data.sessions.length, active: countActive(data.sessions) }))
      .catch(() => !cancelled && setSessions({ total: 0, active: 0 }))
    api
      .get<{ versions: Version[] }>('/versions')
      .then(({ data }) => !cancelled && setVersions(data.versions))
      .catch(() => !cancelled && setVersions([]))
    return () => {
      cancelled = true
    }
  }, [])

  if (!user) return null

  const latest = versions?.[0]

  return (
    <>
      <PageHeader title="Visão geral" description="Resumo da sua conta no JUK.re DDNS." />

      <section className="admin-card admin-welcome" style={{ marginBottom: 16 }}>
        <img src={getAvatarUrl(user)} alt="" />
        <div>
          <strong>
            {hello}, {(user.name ?? user.username ?? '').split(' ')[0] || 'por aqui'}!
          </strong>
          <span>{user.email ?? (user.username ? `@${user.username}` : '')}</span>
        </div>
      </section>

      <div className="admin-stats">
        <Link to="/sessions" className="admin-card admin-stat">
          <span className="admin-stat-label">
            <IconBadge size="sm">
              <MonitorSmartphone size={14} />
            </IconBadge> Sessões ativas
          </span>
          <span className="admin-stat-value">{sessions?.active ?? '—'}</span>
          <span className="admin-stat-hint">{sessions ? `${sessions.total} no histórico` : 'Carregando…'}</span>
        </Link>

        <Link to="/versions" className="admin-card admin-stat">
          <span className="admin-stat-label">
            <IconBadge size="sm">
              <History size={14} />
            </IconBadge> Última versão
          </span>
          <span className="admin-stat-value">{versions ? (latest?.version ?? 'Nenhuma') : '—'}</span>
          <span className="admin-stat-hint">
            {latest ? new Date(latest.created_at).toLocaleDateString('pt-BR') : versions ? 'Nada registrado ainda' : 'Carregando…'}
          </span>
        </Link>

        <div className="admin-card admin-stat">
          <span className="admin-stat-label">
            <IconBadge size="sm">
              <Globe size={14} />
            </IconBadge> Hosts
          </span>
          <span className="admin-stat-value">—</span>
          <span className="admin-stat-hint">Em breve</span>
        </div>
      </div>

      <section className="admin-card admin-soon">
        <IconBadge>
          <Globe size={17} />
        </IconBadge>
        <div>
          <strong>Gerenciamento de hosts chegando</strong>
          <p>
            Em breve você vai cadastrar hosts aqui e atualizar o IP deles via HTTP ou pelo cliente CLI em Go.
          </p>
        </div>
      </section>
    </>
  )
}
