import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { getLogs } from '../../lib/hosts'
import { formatDateTime, relativeTime } from '../../lib/time'
import type { HostLogEntry, HostLogResult } from '../../types'
import { Button } from '../../ui'

// Log de requisições: as últimas 30 chamadas que o conector fez à API de
// atualização (/v1/update e /nic/update). Serve pra confirmar que o
// roteador/script está chamando a API e ver o que ela respondeu.
// Chamadas com token inválido não aparecem (sem token não dá pra saber o host).

const RESULT: Record<HostLogResult, { label: string; tone: 'ok' | 'neutral' | 'warn' | 'bad' }> = {
  updated: { label: 'Atualizado', tone: 'ok' },
  unchanged: { label: 'Sem mudança', tone: 'neutral' },
  disabled: { label: 'DDNS pausado', tone: 'warn' },
  rate_limited: { label: 'Muito frequente', tone: 'warn' },
  nohost: { label: 'Hostname errado', tone: 'bad' },
  bad_ip: { label: 'IP inválido', tone: 'bad' },
  error: { label: 'Erro no DNS', tone: 'bad' },
}

const SOURCE_LABEL: Record<string, string> = { v1: 'HTTP (v1)', dyndns2: 'dyndns2' }

export function HostRequestLog({ hostId, now }: { hostId: string; now: number }) {
  const [logs, setLogs] = useState<HostLogEntry[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  // Muda a cada clique em "Atualizar" e dispara a busca de novo.
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    getLogs(hostId)
      .then((list) => {
        if (cancelled) return
        setLogs(list)
        setFailed(false)
      })
      .catch(() => {
        if (cancelled) return
        setFailed(true)
        setLogs((prev) => prev ?? [])
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [hostId, reloadKey])

  function reload() {
    setLoading(true)
    setReloadKey((k) => k + 1)
  }

  return (
    <section className="admin-card">
      <div className="host-section-head">
        <div>
          <h2>Log de requisições</h2>
          <p className="host-lead">As últimas 30 chamadas que o seu aparelho fez à API, da mais recente para a mais antiga.</p>
        </div>
        <Button variant="outline" size="sm" onClick={reload} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'host-spin' : ''} /> Atualizar
        </Button>
      </div>

      {failed && <p className="host-error">Não foi possível carregar o log.</p>}
      {logs === null && <p className="host-muted">Carregando…</p>}
      {logs && logs.length === 0 && !failed && (
        <p className="host-muted">
          Nenhuma chamada registrada ainda. Assim que o seu roteador ou script chamar a API, ela aparece aqui.
        </p>
      )}

      {logs && logs.length > 0 && (
        <div className="host-table-wrap host-table-wrap--flat">
          <table className="host-table host-log-table">
            <thead>
              <tr>
                <th>Quando</th>
                <th>Resultado</th>
                <th>IP</th>
                <th>Origem</th>
                <th>Detalhe</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => {
                const r = RESULT[l.result] ?? { label: l.result, tone: 'neutral' as const }
                return (
                  <tr key={l.id}>
                    <td title={formatDateTime(l.created_at)}>
                      <span className="host-log-when">{relativeTime(l.created_at, now)}</span>
                      <span className="host-log-sub">{formatDateTime(l.created_at)}</span>
                    </td>
                    <td>
                      <span className={`host-log-badge host-log-badge--${r.tone}`}>{r.label}</span>
                      <span className="host-log-sub">HTTP {l.status}</span>
                    </td>
                    <td>
                      {l.ip ? <code>{l.ip}</code> : <span className="host-muted">—</span>}
                      {l.record_type && <span className="host-log-sub">{l.record_type}</span>}
                    </td>
                    <td>
                      <span>{SOURCE_LABEL[l.source] ?? l.source}</span>
                      {l.caller_ip && l.caller_ip !== l.ip && <span className="host-log-sub">de {l.caller_ip}</span>}
                    </td>
                    <td className="host-log-detail">
                      {l.message && <span>{l.message}</span>}
                      {l.user_agent && (
                        <span className="host-log-sub" title={l.user_agent}>
                          {l.user_agent}
                        </span>
                      )}
                      {!l.message && !l.user_agent && <span className="host-muted">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
