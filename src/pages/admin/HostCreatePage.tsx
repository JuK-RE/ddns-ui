import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, TriangleAlert } from 'lucide-react'
import { AvailabilityHint } from '../../components/hosts/AvailabilityField'
import { ConnectorGuide } from '../../components/hosts/ConnectorGuide'
import { ConnectorPicker } from '../../components/hosts/ConnectorPicker'
import { TokenReveal } from '../../components/hosts/TokenReveal'
import { CONNECTORS } from '../../components/hosts/connectors'
import { apiError, createHost, listHosts, listZones } from '../../lib/hosts'
import { sanitizeName, slugify } from '../../lib/slug'
import { useAvailability } from '../../lib/useAvailability'
import type { Connector, Host, Zone } from '../../types'
import { Button, ButtonLink, RichText } from '../../ui'
import { PageHeader } from './PageHeader'
import './Hosts.css'

const STEPS = ['Identificação', 'Endereço', 'Conexão', 'Pronto'] as const

type Created = { host: Host; token: string }

function isConnector(value: string | null): value is Connector {
  return CONNECTORS.some((c) => c.id === value && !c.soon)
}

export function HostCreatePage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [step, setStep] = useState(0)
  const [label, setLabel] = useState('')
  const [name, setName] = useState('')
  const [zone, setZone] = useState(params.get('zone') ?? '')
  const [connector, setConnector] = useState<Connector | null>(() => {
    const preset = params.get('connector')
    return isConnector(preset) ? preset : null
  })

  const [zones, setZones] = useState<Zone[] | null>(null)
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<Created | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([listZones(), listHosts()])
      .then(([z, h]) => {
        if (cancelled) return
        setZones(z)
        setUsage({ used: h.used, limit: h.limit })
        // zona pré-selecionada por ?zone=… só vale se existir; senão, a primeira
        setZone((current) => (z.some((x) => x.suffix === current) ? current : (z[0]?.suffix ?? '')))
      })
      .catch(() => !cancelled && setLoadError(true))
    return () => {
      cancelled = true
    }
  }, [])

  const availability = useAvailability(name, zone)
  const fqdn = `${name || 'seu-nome'}.${zone || 'ip.juk.re'}`
  const atLimit = usage !== null && usage.used >= usage.limit

  function nextFromLabel(e: FormEvent) {
    e.preventDefault()
    if (!name) setName(slugify(label))
    setStep(1)
  }

  function nextFromAddress(e: FormEvent) {
    e.preventDefault()
    setStep(2)
  }

  async function handleCreate() {
    if (!connector) return
    setSaving(true)
    setError(null)

    try {
      setCreated(await createHost({ label: label.trim(), name, zone, connector }))
      setStep(3)
    } catch (err) {
      const { message, code } = apiError(err, 'Não foi possível criar o host.')
      // Alguém pegou o nome no meio do caminho: volta pro passo do endereço.
      if (code === 'taken' || code === 'quarantine' || code === 'reserved' || code === 'invalid') setStep(1)
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const header = <PageHeader title="Novo host" description="Crie um endereço fixo em 4 passos." />

  if (loadError) {
    return (
      <>
        {header}
        <div className="host-wizard">
          <div className="admin-card host-empty">
            <p>Não foi possível carregar as zonas disponíveis.</p>
            <ButtonLink to="/hosts" variant="outline" size="sm">Voltar</ButtonLink>
          </div>
        </div>
      </>
    )
  }

  if (atLimit && !created) {
    return (
      <>
        {header}
        <div className="host-wizard">
          <div className="admin-card host-empty">
            <TriangleAlert size={22} />
            <p>
              <RichText text={`Você usou os ${usage?.limit} hosts do plano gratuito. Para mais, [fale com a nossa equipe](https://www.jucasoft.com.br/).`} />
            </p>
            <ButtonLink to="/hosts" variant="outline" size="sm">Ver meus hosts</ButtonLink>
          </div>
        </div>
      </>
    )
  }

  const addressOk = availability.state === 'available'

  return (
    <>
      {header}

      <div className="host-wizard">
        <ol className="host-steps" aria-label="Passos">
          {STEPS.map((title, i) => (
            <li key={title} className={i === step ? 'is-current' : i < step ? 'is-done' : ''} aria-current={i === step ? 'step' : undefined}>
              <span className="host-step-num">{i < step ? <Check size={12} /> : i + 1}</span>
              {title}
            </li>
          ))}
        </ol>

        <div className="admin-card host-wizard-card">
          {step === 0 && (
            <form onSubmit={nextFromLabel}>
              <h2>Identificação</h2>
              <p className="host-lead">Um nome só pra você reconhecer este host no painel.</p>

              <div className="host-field">
                <label htmlFor="host-label">Nome do host</label>
                <input
                  id="host-label"
                  className="host-input"
                  placeholder="Ex.: Clínica Asa Sul"
                  maxLength={60}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  autoFocus
                  autoComplete="off"
                />
              </div>

              <div className="host-form-actions">
                <Link to="/hosts" className="ui-btn ui-btn--outline ui-btn--md">Cancelar</Link>
                <Button type="submit" disabled={!label.trim()}>
                  Continuar <ArrowRight size={16} />
                </Button>
              </div>
            </form>
          )}

          {step === 1 && (
            <form onSubmit={nextFromAddress}>
              <h2>Endereço</h2>
              <p className="host-lead">É esse endereço que vai acompanhar o IP da sua rede.</p>

              <div className="host-field">
                <label htmlFor="host-name">Subdomínio e zona</label>
                <div className="host-address">
                  <input
                    id="host-name"
                    className="host-input"
                    placeholder="clinicajuca"
                    value={name}
                    onChange={(e) => setName(sanitizeName(e.target.value))}
                    autoFocus
                    autoComplete="off"
                    spellCheck={false}
                    aria-describedby="host-name-hint"
                  />
                  <select className="host-input" value={zone} onChange={(e) => setZone(e.target.value)} aria-label="Zona">
                    {(zones ?? []).map((z) => (
                      <option key={z.id} value={z.suffix}>
                        .{z.suffix}
                      </option>
                    ))}
                  </select>
                </div>
                <div id="host-name-hint">
                  <AvailabilityHint status={availability} fqdn={fqdn} />
                </div>
              </div>

              <div className="host-preview">
                <span>Prévia</span>
                <code>{fqdn}</code>
              </div>

              {zone === 'rdp.juk.re' && (
                <p className="host-warning">
                  <TriangleAlert size={15} />
                  Expor o RDP direto na internet é arriscado. Prefira VPN ou libere só IPs conhecidos.
                </p>
              )}

              {error && <p className="host-error">{error}</p>}

              <div className="host-form-actions">
                <Button variant="outline" onClick={() => { setError(null); setStep(0) }}>
                  <ArrowLeft size={16} /> Voltar
                </Button>
                <Button type="submit" disabled={!addressOk}>
                  Continuar <ArrowRight size={16} />
                </Button>
              </div>
            </form>
          )}

          {step === 2 && (
            <div>
              <h2>Conexão</h2>
              <p className="host-lead">Como o seu aparelho vai avisar o IP novo? Isso só muda o tutorial que mostramos.</p>

              <ConnectorPicker value={connector} onChange={setConnector} />

              {error && <p className="host-error">{error}</p>}

              <div className="host-form-actions">
                <Button variant="outline" onClick={() => setStep(1)} disabled={saving}>
                  <ArrowLeft size={16} /> Voltar
                </Button>
                <Button onClick={() => void handleCreate()} disabled={!connector || saving}>
                  {saving ? 'Criando…' : 'Criar host'}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && created && (
            <div>
              <h2>Pronto! <code>{created.host.fqdn}</code> foi criado</h2>
              <p className="host-lead">
                O registro de DNS é criado na primeira chamada do seu aparelho. Depois disso, ele acompanha o IP sozinho.
              </p>

              <TokenReveal token={created.token} />

              <h3 className="host-subtitle">Como conectar</h3>
              <ConnectorGuide
                connector={created.host.connector}
                fqdn={created.host.fqdn}
                token={created.token}
                tokenPrefix={created.host.token_prefix}
              />

              <div className="host-form-actions">
                <span />
                <Button onClick={() => navigate(`/hosts/${created.host.id}`)}>Ir para o host</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
