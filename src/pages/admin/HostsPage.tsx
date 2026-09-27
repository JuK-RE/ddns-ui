import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Globe, Plus, RefreshCw, Search, ChevronRight } from 'lucide-react'
import { CopyButton } from '../../components/hosts/CopyButton'
import { HostStatusBadge } from '../../components/hosts/HostStatusBadge'
import { connectorMeta } from '../../components/hosts/connectors'
import { CONNECTOR_LABEL, MAX_HOSTS, hostStatus, listHosts } from '../../lib/hosts'
import { relativeTime, useNow } from '../../lib/time'
import type { Host, HostStatus } from '../../types'
import { Button, ButtonLink, IconBadge, RichText } from '../../ui'
import { PageHeader } from './PageHeader'
import './Hosts.css'

type Loaded = { hosts: Host[]; limit: number } | 'error' | null

const USE_CASES = [
  { title: 'Conectar um roteador', text: 'MikroTik, pfSense/OPNsense, UniFi e ddclient atualizam o IP sozinhos.', to: '/docs/conectar-roteador' },
  { title: 'Servidor ou PC', text: 'Um comando curl ou PowerShell agendado a cada 15 minutos.', to: '/docs/conectar-pc' },
  { title: 'IPv6, DNS e DDNS pausado', text: 'Edite o registro na mão e escolha quando o DDNS atualiza.', to: '/docs/dns-ipv6' },
]

export function HostsPage() {
  const navigate = useNavigate()
  const now = useNow()
  const [data, setData] = useState<Loaded>(null)
  const [reloading, setReloading] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | HostStatus>('all')
  // Muda a cada "atualizar" pra refazer a busca.
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    listHosts()
      .then((res) => !cancelled && setData({ hosts: res.hosts, limit: res.limit }))
      .catch(() => !cancelled && setData('error'))
      .finally(() => !cancelled && setReloading(false))
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const hosts = data && data !== 'error' ? data.hosts : null
  const limit = data && data !== 'error' ? data.limit : MAX_HOSTS
  const atLimit = hosts !== null && hosts.length >= limit

  const visible = useMemo(() => {
    if (!hosts) return []
    const q = query.trim().toLowerCase()
    return hosts.filter((h) => {
      if (statusFilter !== 'all' && hostStatus(h, now) !== statusFilter) return false
      if (!q) return true
      return `${h.label} ${h.fqdn}`.toLowerCase().includes(q)
    })
  }, [hosts, query, statusFilter, now])

  function refresh() {
    setReloading(true)
    setReloadKey((k) => k + 1)
  }

  return (
    <>
      <PageHeader
        title="Hosts"
        description="Endereços fixos que acompanham o IP da sua rede. Um conector avisa a API e o DNS é atualizado."
        actions={
          <>
            <span className="host-counter">
              {hosts ? hosts.length : '—'} de {limit}
            </span>
            <ButtonLink to="/hosts/new" aria-disabled={atLimit} className={atLimit ? 'is-disabled' : ''} onClick={(e) => atLimit && e.preventDefault()}>
              <Plus size={16} /> Novo host
            </ButtonLink>
          </>
        }
      />

      {atLimit && (
        <div className="host-notice">
          <RichText text={`Você usou os ${limit} hosts do plano gratuito. Para mais, [fale com a nossa equipe](https://www.jucasoft.com.br/).`} />
        </div>
      )}

      <div className="host-layout">
        <div className="host-main">
          <div className="host-toolbar">
            <label className="host-search">
              <Search size={15} />
              <input
                type="search"
                placeholder="Buscar por nome ou endereço…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <select
              className="host-input host-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | HostStatus)}
              aria-label="Filtrar por status"
            >
              <option value="all">Todos os status</option>
              <option value="online">Online</option>
              <option value="stale">Sem contato</option>
              <option value="offline">Offline</option>
              <option value="pending">Aguardando conexão</option>
              <option value="paused">DDNS pausado</option>
            </select>
            <button type="button" className="host-icon-btn" onClick={refresh} aria-label="Atualizar lista" title="Atualizar">
              <RefreshCw size={15} className={reloading ? 'host-spin' : ''} />
            </button>
          </div>

          {data === null && <div className="admin-card host-empty">Carregando…</div>}

          {data === 'error' && (
            <div className="admin-card host-empty">
              <p>Não foi possível carregar os seus hosts.</p>
              <Button variant="outline" size="sm" onClick={refresh}>
                Tentar de novo
              </Button>
            </div>
          )}

          {hosts && hosts.length === 0 && (
            <div className="admin-card host-empty">
              <IconBadge size="lg">
                <Globe size={20} />
              </IconBadge>
              <h2>Crie seu primeiro host</h2>
              <p>Ganhe um endereço fixo, como <code>minhaloja.ip.juk.re</code>, que sempre aponta para o IP da sua rede.</p>
              <ButtonLink to="/hosts/new">
                <Plus size={16} /> Novo host
              </ButtonLink>
            </div>
          )}

          {hosts && hosts.length > 0 && (
            <div className="host-table-wrap">
              <table className="host-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Status</th>
                    <th>IP atual</th>
                    <th>Verificado</th>
                    <th>Conexão</th>
                    <th aria-label="Ações" />
                  </tr>
                </thead>
                <tbody>
                  {visible.map((h) => {
                    const Icon = connectorMeta(h.connector).icon
                    return (
                      <tr key={h.id} className="is-clickable" onClick={() => navigate(`/hosts/${h.id}`)}>
                        <td>
                          <Link to={`/hosts/${h.id}`} className="host-name" onClick={(e) => e.stopPropagation()}>
                            {h.label}
                          </Link>
                          <span className="host-fqdn" onClick={(e) => e.stopPropagation()}>
                            <code>{h.fqdn}</code>
                            <CopyButton text={h.fqdn} label="Copiar endereço" />
                          </span>
                        </td>
                        <td>
                          <HostStatusBadge status={hostStatus(h, now)} />
                        </td>
                        <td>
                          {h.last_ipv4 || h.last_ipv6 ? (
                            <>
                              {h.last_ipv4 && <code>{h.last_ipv4}</code>}
                              {h.last_ipv6 && (
                                <code className="host-ipv6" title={h.last_ipv6}>
                                  {h.last_ipv6}
                                </code>
                              )}
                            </>
                          ) : (
                            <span className="host-muted">—</span>
                          )}
                        </td>
                        <td className="host-muted">{h.last_check_at ? relativeTime(h.last_check_at, now) : '—'}</td>
                        <td>
                          <span className="host-connector-cell" title={CONNECTOR_LABEL[h.connector]}>
                            <Icon size={15} /> {CONNECTOR_LABEL[h.connector]}
                          </span>
                        </td>
                        <td className="host-actions-cell">
                          <ChevronRight size={16} aria-hidden="true" />
                        </td>
                      </tr>
                    )
                  })}
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={6} className="host-muted host-no-results">
                        Nenhum host encontrado com esses filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {hosts && hosts.length > 0 && (
            <p className="host-showing">
              Mostrando {visible.length} de {hosts.length}
            </p>
          )}
        </div>

        <aside className="host-aside">
          <h2>Casos de uso</h2>
          <p>Guias rápidos da documentação para cada cenário.</p>
          {USE_CASES.map((c) => (
            <Link key={c.title} to={c.to} className="admin-card host-usecase">
              <span>
                <strong>{c.title}</strong>
                <small>{c.text}</small>
              </span>
              <ChevronRight size={16} aria-hidden="true" />
            </Link>
          ))}
        </aside>
      </div>
    </>
  )
}
