import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Info, Pencil, Search } from 'lucide-react'
import { Switch } from '../../components/hosts/Switch'
import { CopyButton } from '../../components/hosts/CopyButton'
import { apiError, listHosts, updateDns } from '../../lib/hosts'
import type { Host } from '../../types'
import { Button, ButtonLink } from '../../ui'
import { PageHeader } from './PageHeader'
import './Hosts.css'

type Loaded = Host[] | 'error' | null

// Formulário inline de edição do registro (estilo "Edit" da Cloudflare):
// endereço fixo, IPv4/IPv6 editáveis, proxy e TTL só informativos.
function DnsEditForm({ host, onSaved, onCancel }: { host: Host; onSaved: (h: Host) => void; onCancel: () => void }) {
  const [ipv4, setIpv4] = useState(host.last_ipv4 ?? '')
  const [ipv6, setIpv6] = useState(host.last_ipv6 ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const changed4 = ipv4.trim() !== (host.last_ipv4 ?? '')
  const changed6 = ipv6.trim() !== (host.last_ipv6 ?? '')

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const patch: { ipv4?: string | null; ipv6?: string | null } = {}
    if (changed4) patch.ipv4 = ipv4.trim() || null
    if (changed6) patch.ipv6 = ipv6.trim() || null

    try {
      onSaved(await updateDns(host.id, patch))
    } catch (err) {
      setError(apiError(err, 'Não foi possível salvar o registro.').message)
      setSaving(false)
    }
  }

  return (
    <form className="host-dns-form" onSubmit={(e) => void handleSave(e)}>
      <div className="host-dns-grid">
        <div className="host-field">
          <label htmlFor={`dns-name-${host.id}`}>Nome</label>
          <input id={`dns-name-${host.id}`} className="host-input" value={host.fqdn} readOnly disabled />
        </div>
        <div className="host-field">
          <label htmlFor={`dns-v4-${host.id}`}>Endereço IPv4 (A)</label>
          <input
            id={`dns-v4-${host.id}`}
            className="host-input"
            placeholder="ex.: 187.72.41.53"
            value={ipv4}
            onChange={(e) => setIpv4(e.target.value)}
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <div className="host-field">
          <label htmlFor={`dns-v6-${host.id}`}>Endereço IPv6 (AAAA)</label>
          <input
            id={`dns-v6-${host.id}`}
            className="host-input"
            placeholder="ex.: 2804:14d::1"
            value={ipv6}
            onChange={(e) => setIpv6(e.target.value)}
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <div className="host-field">
          <span className="host-field-title">Proxy e TTL</span>
          <span className="host-static">Somente DNS · TTL 60 s</span>
        </div>
      </div>

      <p className="host-hint">
        Deixe um campo vazio para remover aquele registro.{' '}
        {host.ddns_enabled && 'Com o DDNS ativo, a próxima chamada do conector pode sobrescrever estes valores: desative o DDNS para fixá-los.'}
      </p>

      {error && <p className="host-error">{error}</p>}

      <div className="host-form-actions host-form-actions--left">
        <Button type="submit" size="sm" disabled={(!changed4 && !changed6) || saving}>
          {saving ? 'Salvando…' : 'Salvar'}
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

export function DnsPage() {
  const [data, setData] = useState<Loaded>(null)
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    listHosts()
      .then((res) => !cancelled && setData(res.hosts))
      .catch(() => !cancelled && setData('error'))
    return () => {
      cancelled = true
    }
  }, [])

  const hosts = Array.isArray(data) ? data : null

  const visible = useMemo(() => {
    if (!hosts) return []
    const q = query.trim().toLowerCase()
    return q ? hosts.filter((h) => `${h.label} ${h.fqdn} ${h.last_ipv4 ?? ''} ${h.last_ipv6 ?? ''}`.toLowerCase().includes(q)) : hosts
  }, [hosts, query])

  function replaceHost(updated: Host) {
    setData((current) => (Array.isArray(current) ? current.map((h) => (h.id === updated.id ? updated : h)) : current))
  }

  async function toggleDdns(host: Host, next: boolean) {
    setBusyId(host.id)
    setError(null)
    try {
      replaceHost(await updateDns(host.id, { ddns_enabled: next }))
    } catch (err) {
      setError(apiError(err, 'Não foi possível alterar o DDNS.').message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <PageHeader
        title="DNS"
        description="Os registros dos seus hosts. Edite o IP na mão ou pause o DDNS para o conector parar de atualizar."
        actions={
          <ButtonLink to="/docs/dns-ipv6" variant="outline" size="sm">
            Como funciona
          </ButtonLink>
        }
      />

      <div className="host-notice host-notice--info">
        <Info size={16} />
        <span>
          <strong>DDNS ativo:</strong> o roteador ou script atualiza o IP sozinho. <strong>DDNS pausado:</strong> as
          chamadas do conector são ignoradas e o registro fica como está, até você editar aqui.
        </span>
      </div>

      <div className="host-toolbar">
        <label className="host-search">
          <Search size={15} />
          <input
            type="search"
            placeholder="Buscar por nome, endereço ou IP…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>

      {error && <p className="host-error" role="alert">{error}</p>}

      {data === null && <div className="admin-card host-empty">Carregando…</div>}
      {data === 'error' && <div className="admin-card host-empty">Não foi possível carregar os registros.</div>}

      {hosts && hosts.length === 0 && (
        <div className="admin-card host-empty">
          <h2>Nenhum registro ainda</h2>
          <p>Os registros aparecem aqui quando você cria um host.</p>
          <ButtonLink to="/hosts/new">Novo host</ButtonLink>
        </div>
      )}

      {hosts && hosts.length > 0 && (
        <div className="host-table-wrap">
          <table className="host-table host-dns-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>IPv4 (A)</th>
                <th>IPv6 (AAAA)</th>
                <th>TTL</th>
                <th>DDNS</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {visible.map((h) => (
                <DnsRows
                  key={h.id}
                  host={h}
                  open={editing === h.id}
                  busy={busyId === h.id}
                  onToggle={(next) => void toggleDdns(h, next)}
                  onEdit={() => setEditing(editing === h.id ? null : h.id)}
                  onSaved={(updated) => {
                    replaceHost(updated)
                    setEditing(null)
                  }}
                />
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="host-muted host-no-results">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {hosts && hosts.length > 0 && (
        <p className="host-showing">
          Mostrando {visible.length} de {hosts.length} ·{' '}
          <Link to="/hosts" className="host-inline-link">Gerenciar hosts</Link>
        </p>
      )}
    </>
  )
}

function DnsRows({
  host,
  open,
  busy,
  onToggle,
  onEdit,
  onSaved,
}: {
  host: Host
  open: boolean
  busy: boolean
  onToggle: (next: boolean) => void
  onEdit: () => void
  onSaved: (h: Host) => void
}) {
  return (
    <>
      <tr className={open ? 'is-open' : ''}>
        <td>
          <Link to={`/hosts/${host.id}`} className="host-name">{host.label}</Link>
          <span className="host-fqdn">
            <code>{host.fqdn}</code>
            <CopyButton text={host.fqdn} label="Copiar endereço" />
          </span>
        </td>
        <td>{host.last_ipv4 ? <code>{host.last_ipv4}</code> : <span className="host-muted">—</span>}</td>
        <td>
          {host.last_ipv6 ? (
            <code className="host-ipv6" title={host.last_ipv6}>{host.last_ipv6}</code>
          ) : (
            <span className="host-muted">—</span>
          )}
        </td>
        <td className="host-muted">60 s</td>
        <td>
          <span className="host-ddns-cell">
            <Switch
              checked={host.ddns_enabled}
              disabled={busy}
              onChange={onToggle}
              label={host.ddns_enabled ? 'Pausar DDNS' : 'Ativar DDNS'}
            />
            <span className={host.ddns_enabled ? '' : 'host-muted'}>{host.ddns_enabled ? 'Ativo' : 'Pausado'}</span>
          </span>
        </td>
        <td className="host-actions-cell">
          <button type="button" className="host-link-btn" onClick={onEdit} aria-expanded={open}>
            <Pencil size={13} /> Editar
          </button>
        </td>
      </tr>
      {open && (
        <tr className="host-dns-edit">
          <td colSpan={6}>
            <DnsEditForm host={host} onSaved={onSaved} onCancel={onEdit} />
          </td>
        </tr>
      )}
    </>
  )
}
