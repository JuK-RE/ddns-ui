import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Globe, History, Wifi } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { api } from '../../lib/api'
import { getAvatarUrl } from '../../lib/avatar'
import { MAX_HOSTS, hostStatus, listHosts } from '../../lib/hosts'
import { useNow } from '../../lib/time'
import type { Host } from '../../types'
import { IconBadge } from '../../ui'
import { PageHeader } from './PageHeader'

type Version = { id: number; version: string; description: string | null; created_at: string }

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function OverviewPage() {
  const { user } = useAuth()
  const now = useNow()
  const [hello] = useState(greeting)
  const [hosts, setHosts] = useState<{ list: Host[]; limit: number } | null>(null)
  const [versions, setVersions] = useState<Version[] | null>(null)
  const isAdmin = Boolean(user?.is_admin)

  useEffect(() => {
    let cancelled = false
    listHosts()
      .then((res) => !cancelled && setHosts({ list: res.hosts, limit: res.limit }))
      .catch(() => !cancelled && setHosts({ list: [], limit: MAX_HOSTS }))

    // Última versão: só administradores (a rota é restrita no backend).
    if (isAdmin) {
      api
        .get<{ versions: Version[] }>('/versions')
        .then(({ data }) => !cancelled && setVersions(data.versions))
        .catch(() => !cancelled && setVersions([]))
    }
    return () => {
      cancelled = true
    }
  }, [isAdmin])

  if (!user) return null

  const online = hosts ? hosts.list.filter((h) => hostStatus(h, now) === 'online').length : null
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
        <Link to="/hosts" className="admin-card admin-stat">
          <span className="admin-stat-label">
            <IconBadge size="sm">
              <Globe size={14} />
            </IconBadge> Hosts
          </span>
          <span className="admin-stat-value">{hosts ? `${hosts.list.length} de ${hosts.limit}` : '—'}</span>
          <span className="admin-stat-hint">
            {hosts ? (hosts.list.length === 0 ? 'Crie seu primeiro host' : 'Gerenciar hosts') : 'Carregando…'}
          </span>
        </Link>

        <Link to="/hosts" className="admin-card admin-stat">
          <span className="admin-stat-label">
            <IconBadge size="sm">
              <Wifi size={14} />
            </IconBadge> Online agora
          </span>
          <span className="admin-stat-value">{online ?? '—'}</span>
          <span className="admin-stat-hint">Com contato na última hora e meia</span>
        </Link>

        {isAdmin && (
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
        )}
      </div>
    </>
  )
}
