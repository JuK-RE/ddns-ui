import { useState } from 'react'
import { PUBLIC_UPDATE_BASE } from '../../ui/links'
import type { Connector } from '../../types'
import { CodeBlock, FieldRow } from './CodeBlock'

// Tutoriais por conector, já preenchidos com o endereço e o token.
// Intervalo: padrão de 15 min, mínimo de 5 min (a API recusa chamadas mais
// próximas que isso com 429/abuse). Conectores dyndns2 e a futura CLI só
// chamam a API quando o IP muda.

type Interval = 5 | 15 | 30 | 60

const INTERVALS: { value: Interval; label: string }[] = [
  { value: 15, label: '15 min (recomendado)' },
  { value: 30, label: '30 min' },
  { value: 60, label: '60 min' },
  { value: 5, label: '5 min (mínimo, só se precisar)' },
]

function cronFor(minutes: Interval) {
  return minutes === 60 ? '0 * * * *' : `*/${minutes} * * * *`
}

function IntervalSelect({ value, onChange }: { value: Interval; onChange: (v: Interval) => void }) {
  return (
    <div className="host-interval">
      <label>
        Verificar a cada{' '}
        <select className="host-input host-input--inline" value={value} onChange={(e) => onChange(Number(e.target.value) as Interval)}>
          {INTERVALS.map((i) => (
            <option key={i.value} value={i.value}>
              {i.label}
            </option>
          ))}
        </select>
      </label>
      {value === 5 && (
        <p className="host-hint">Chamadas com menos de 5 minutos de intervalo são recusadas pela API (429).</p>
      )}
    </div>
  )
}

export function ConnectorGuide({
  connector,
  fqdn,
  token,
  tokenPrefix,
}: {
  connector: Connector
  fqdn: string
  /** Token completo (logo após criar/regenerar). Sem ele, o guia mostra o token mascarado. */
  token?: string | null
  tokenPrefix: string
}) {
  const [interval, setIntervalValue] = useState<Interval>(15)

  const masked = !token
  const tokenText = token ?? `${tokenPrefix}••••••••`
  const updateUrl = `${PUBLIC_UPDATE_BASE}/v1/update/${tokenText}`
  const host = PUBLIC_UPDATE_BASE.replace(/^https?:\/\//, '')
  const copyable = !masked

  return (
    <div className="host-guide">
      {masked && (
        <p className="host-hint">
          O token aparece mascarado. Para ver a URL completa, gere um token novo (ele só é exibido uma vez).
        </p>
      )}

      {connector === 'http' && (
        <>
          <IntervalSelect value={interval} onChange={setIntervalValue} />

          <CodeBlock
            title="Linux / macOS (cron)"
            copyable={copyable}
            code={`${cronFor(interval)} curl -4 -fsS "${updateUrl}" >/dev/null`}
          />

          <CodeBlock
            title="Windows (PowerShell): teste"
            copyable={copyable}
            code={`Invoke-RestMethod "${updateUrl}"`}
          />

          <CodeBlock
            title={`Windows (PowerShell): agendar a cada ${interval} min`}
            copyable={copyable}
            code={[
              `$acao = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-NoProfile -Command "Invoke-RestMethod ''${updateUrl}''"'`,
              `$gatilho = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes ${interval}) -RepetitionDuration (New-TimeSpan -Days 3650)`,
              `Register-ScheduledTask -TaskName 'JUKre DDNS' -Action $acao -Trigger $gatilho`,
            ].join('\n')}
          />
        </>
      )}

      {connector === 'mikrotik' && (
        <>
          <IntervalSelect value={interval} onChange={setIntervalValue} />

          <CodeBlock
            title="RouterOS: só chama a API quando o IP da WAN muda"
            copyable={copyable}
            code={[
              '/system script add name=jukre-ddns source={',
              '  :global jukreLastIp',
              '  :local ip [/ip address get [find interface="pppoe-out1"] address]',
              '  :set ip [:pick $ip 0 [:find $ip "/"]]',
              '  :if ($ip != $jukreLastIp) do={',
              `    /tool fetch url="${updateUrl}" output=none`,
              '    :set jukreLastIp $ip',
              '  }',
              '}',
              `/system scheduler add name=jukre-ddns interval=${interval === 60 ? '1h' : `${interval}m`} on-event=jukre-ddns`,
            ].join('\n')}
          />
          <p className="host-hint">Troque <code>pppoe-out1</code> pela interface de internet do seu MikroTik.</p>

          <CodeBlock
            title="Atrás de CGNAT (IP da WAN privado): versão simples"
            copyable={copyable}
            code={`/system scheduler add name=jukre-ddns interval=${interval === 60 ? '1h' : `${interval}m`} on-event="/tool fetch url=\\"${updateUrl}\\" output=none"`}
          />
        </>
      )}

      {connector === 'pfsense' && (
        <>
          <p className="host-guide-lead">
            <strong>Serviços → DNS Dinâmico → Add</strong>, tipo <strong>Custom</strong> (dyndns2). O próprio pfSense/OPNsense
            verifica o IP e só chama a API quando ele muda.
          </p>
          <div className="host-fields">
            <FieldRow label="URL de atualização" value={`${PUBLIC_UPDATE_BASE}/nic/update?hostname=%HOST%&myip=%IP%`} />
            <FieldRow label="Usuário" value={fqdn} />
            <FieldRow label="Senha" value={tokenText} copyable={copyable} />
          </div>
        </>
      )}

      {connector === 'unifi' && (
        <>
          <p className="host-guide-lead">
            <strong>Configurações → Internet → DNS Dinâmico → Criar novo</strong>, serviço <strong>custom</strong>.
          </p>
          <div className="host-fields">
            <FieldRow label="Servidor" value={`${host}/nic/update?hostname=%h&myip=%i`} />
            <FieldRow label="Hostname" value={fqdn} />
            <FieldRow label="Usuário" value={fqdn} />
            <FieldRow label="Senha" value={tokenText} copyable={copyable} />
          </div>
        </>
      )}

      {connector === 'ddclient' && (
        <>
          <p className="host-guide-lead">
            Em <code>/etc/ddclient.conf</code>. O <code>daemon=900</code> checa a cada 15 min e só atualiza quando o IP muda.
          </p>
          <CodeBlock
            title="/etc/ddclient.conf"
            copyable={copyable}
            code={['daemon=900', 'use=web', 'protocol=dyndns2', `server=${host}`, 'ssl=yes', `login=${fqdn}`, `password=${tokenText}`, fqdn].join('\n')}
          />
        </>
      )}

      {connector === 'cli' && (
        <p className="host-guide-lead">A CLI em Go chega na próxima fase. Por enquanto, use API / HTTP ou um roteador.</p>
      )}

      <p className="host-hint">
        Os caminhos de menu variam por versão de firmware. Nem todo roteador aceita DNS dinâmico personalizado (muitos
        TP-Link só aceitam No-IP/DynDNS): nesse caso, use um script em outro aparelho da rede.
      </p>
    </div>
  )
}
