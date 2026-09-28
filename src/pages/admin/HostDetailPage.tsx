import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, KeyRound, Trash2 } from 'lucide-react'
import { ConfirmModal } from '../../components/hosts/ConfirmModal'
import { ConnectorGuide } from '../../components/hosts/ConnectorGuide'
import { ConnectorPicker } from '../../components/hosts/ConnectorPicker'
import { CopyButton } from '../../components/hosts/CopyButton'
import { HostRequestLog } from '../../components/hosts/HostRequestLog'
import { HostStatusBadge } from '../../components/hosts/HostStatusBadge'
import { TokenReveal } from '../../components/hosts/TokenReveal'
import { CONNECTOR_LABEL, apiError, deleteHost, getHistory, getHost, hostStatus, regenerateToken, updateHost } from '../../lib/hosts'
import { formatDate, formatDateTime, relativeTime, useNow } from '../../lib/time'
import type { Connector, Host, HostHistoryEntry } from '../../types'
import { Button } from '../../ui'
import { PageHeader } from './PageHeader'
import './Hosts.css'

type Modal = 'token' | 'delete' | null

const SOURCE_LABEL: Record<string, string> = { v1: 'HTTP (v1)', dyndns2: 'dyndns2', cli: 'CLI', manual: 'Manual (painel)' }

export function HostDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const now = useNow()

  const [host, setHost] = useState<Host | null>(null)
  const [history, setHistory] = useState<HostHistoryEntry[] | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loadError, setLoadError] = useState(false)

  // Token novo (só existe na memória, logo após regenerar).
  const [freshToken, setFreshToken] = useState<string | null>(null)
  const [modal, setModal] = useState<Modal>(null)
  const [busy, setBusy] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  const [label, setLabel] = useState('')
  const [connector, setConnector] = useState<Connector>('http')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    getHost(id)
      .then((h) => {
        if (cancelled) return
        setHost(h)
        setLabel(h.label)
        setConnector(h.connector)
      })
      .catch((err) => {
        if (cancelled) return
        if ((err as { response?: { status?: number } }).response?.status === 404) setNotFound(true)
        else setLoadError(true)
      })
    getHistory(id)
      .then((h) => !cancelled && setHistory(h))
      .catch(() => !cancelled && setHistory([]))
    return () => {
      cancelled = true
    }
  }, [id])

  if (notFound || loadError) {
    return (
      <>
        <PageHeader title="Host" />
        <div className="admin-card host-empty">
          <p>{notFound ? 'Host não encontrado.' : 'Não foi possível carregar o host.'}</p>
          <Link to="/hosts" className="ui-btn ui-btn--outline ui-btn--sm">Voltar para os hosts</Link>
        </div>
      </>
    )
  }

  if (!host) {
    return (
      <>
        <PageHeader title="Host" />
        <div className="admin-card host-empty">Carregando…</div>
      </>
    )
  }

  const status = hostStatus(host, now)
  const dirty = label.trim() !== host.label || connector !== host.connector

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!host) return
    setSaving(true)
    setSaveMsg(null)
    try {
      const updated = await updateHost(host.id, { label: label.trim(), connector })
      setHost(updated)
      setSaveMsg({ ok: true, text: 'Alterações salvas.' })
    } catch (err) {
      setSaveMsg({ ok: false, text: apiError(err, 'Não foi possível salvar.').message })
    } finally {
      setSaving(false)
    }
  }

  async function handleRegenerate() {
    if (!host) return
    setBusy(true)
    setModalError(null)
    try {
      const res = await regenerateToken(host.id)
      setFreshToken(res.token)
      setHost({ ...host, token_prefix: res.token_prefix })
      setModal(null)
    } catch (err) {
      setModalError(apiError(err, 'Não foi possível gerar um novo token.').message)
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!host) return
    setBusy(true)
    setModalError(null)
    try {
      await deleteHost(host.id)
      navigate('/hosts', { replace: true })
    } catch (err) {
      setModalError(apiError(err, 'Não foi possível excluir o host.').message)
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        title={host.label}
        eyebrow="Host"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => { setModalError(null); setModal('token') }}>
              <KeyRound size={14} /> Regenerar token
            </Button>
            <Button variant="outline" size="sm" className="host-btn-danger-outline" onClick={() => { setModalError(null); setModal('delete') }}>
              <Trash2 size={14} /> Excluir
            </Button>
          </>
        }
      />

      <Link to="/hosts" className="host-back">
        <ArrowLeft size={14} /> Todos os hosts
      </Link>

      <div className="admin-card host-detail-top">
        <span className="host-fqdn host-fqdn--lg">
          <code>{host.fqdn}</code>
          <CopyButton text={host.fqdn} label="Copiar endereço" />
        </span>
        <span className="host-detail-top-right">
          <Link to="/dns" className="host-inline-link">Editar DNS</Link>
          <HostStatusBadge status={status} />
        </span>
      </div>

      <div className="admin-stats host-stats">
        <div className="admin-card admin-stat">
          <span className="admin-stat-label">IPv4 (A)</span>
          <span className="admin-stat-value host-stat-mono">{host.last_ipv4 ?? '—'}</span>
          <span className="admin-stat-hint">{host.last_ipv4 ? 'Registro A' : 'Sem registro A'}</span>
        </div>
        <div className="admin-card admin-stat">
          <span className="admin-stat-label">IPv6 (AAAA)</span>
          <span className="admin-stat-value host-stat-mono host-stat-v6" title={host.last_ipv6 ?? undefined}>
            {host.last_ipv6 ?? '—'}
          </span>
          <span className="admin-stat-hint">{host.last_ipv6 ? 'Registro AAAA' : 'Sem registro AAAA'}</span>
        </div>
        <div className="admin-card admin-stat">
          <span className="admin-stat-label">Última verificação</span>
          <span className="admin-stat-value" title={formatDateTime(host.last_check_at)}>
            {relativeTime(host.last_check_at, now)}
          </span>
          <span className="admin-stat-hint">{host.last_check_at ? formatDateTime(host.last_check_at) : 'Sem contato ainda'}</span>
        </div>
        <div className="admin-card admin-stat">
          <span className="admin-stat-label">Última mudança de IP</span>
          <span className="admin-stat-value" title={formatDateTime(host.last_change_at)}>
            {relativeTime(host.last_change_at, now)}
          </span>
          <span className="admin-stat-hint">{host.last_change_at ? formatDateTime(host.last_change_at) : 'Nenhuma ainda'}</span>
        </div>
        <div className="admin-card admin-stat">
          <span className="admin-stat-label">Tipo de conexão</span>
          <span className="admin-stat-value host-stat-text">{CONNECTOR_LABEL[host.connector]}</span>
          <span className="admin-stat-hint">Criado em {formatDate(host.created_at)}</span>
        </div>
      </div>

      {freshToken && (
        <section className="admin-card">
          <h2>Novo token gerado</h2>
          <p className="host-lead">O token anterior deixou de funcionar. Atualize a configuração do seu aparelho.</p>
          <TokenReveal token={freshToken} />
        </section>
      )}

      <section className="admin-card">
        <h2>Conexão</h2>
        <ConnectorGuide connector={host.connector} fqdn={host.fqdn} token={freshToken} tokenPrefix={host.token_prefix} />
      </section>

      <section className="admin-card">
        <h2>Histórico de IP</h2>
        {history === null && <p className="host-muted">Carregando…</p>}
        {history && history.length === 0 && <p className="host-muted">Nenhuma mudança de IP registrada ainda.</p>}
        {history && history.length > 0 && (
          <div className="host-table-wrap host-table-wrap--flat">
            <table className="host-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>IP</th>
                  <th>Origem</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td>{formatDateTime(h.created_at)}</td>
                    <td className="host-muted">{h.record_type}</td>
                    <td>
                      <code>{h.old_ip ?? '—'}</code> → <code>{h.new_ip}</code>
                    </td>
                    <td className="host-muted">{SOURCE_LABEL[h.source] ?? h.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <HostRequestLog hostId={host.id} now={now} />

      <section className="admin-card">
        <h2>Configurações</h2>
        <form onSubmit={(e) => void handleSave(e)}>
          <div className="host-field">
            <label htmlFor="host-label">Nome do host</label>
            <input id="host-label" className="host-input" maxLength={60} value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>

          <div className="host-field">
            <span className="host-field-title">Tipo de conexão</span>
            <ConnectorPicker value={connector} onChange={setConnector} />
          </div>

          <p className="host-hint">O endereço não pode ser alterado. Para trocar, exclua este host e crie outro.</p>

          <div className="host-form-actions">
            <span className={saveMsg?.ok ? 'host-hint host-hint--ok' : 'host-error'}>{saveMsg?.text}</span>
            <Button type="submit" disabled={!dirty || !label.trim() || saving}>
              {saving ? 'Salvando…' : 'Salvar alterações'}
            </Button>
          </div>
        </form>
      </section>

      {modal === 'token' && (
        <ConfirmModal
          title="Regenerar token?"
          confirmLabel="Gerar novo token"
          danger={false}
          busy={busy}
          error={modalError}
          onConfirm={() => void handleRegenerate()}
          onCancel={() => setModal(null)}
        >
          <p>O token atual deixa de funcionar imediatamente. Você vai precisar atualizar a configuração do roteador ou script.</p>
        </ConfirmModal>
      )}

      {modal === 'delete' && (
        <ConfirmModal
          title="Excluir host?"
          confirmLabel="Excluir host"
          confirmText={host.fqdn}
          busy={busy}
          error={modalError}
          onConfirm={() => void handleDelete()}
          onCancel={() => setModal(null)}
        >
          <p>
            O DNS deixa de funcionar na hora. O nome fica reservado só para você por 15 dias; depois disso, qualquer pessoa
            pode usá-lo.
          </p>
        </ConfirmModal>
      )}
    </>
  )
}
