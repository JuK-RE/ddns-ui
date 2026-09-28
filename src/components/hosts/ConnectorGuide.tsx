import { useState } from 'react'
import { PUBLIC_UPDATE_BASE } from '../../ui/links'
import type { Connector } from '../../types'
import { CodeBlock, FieldRow } from './CodeBlock'

// Tutoriais por conector, já preenchidos com o endereço e o token.
// Scripts (curl, PowerShell, MikroTik) descobrem o IP público no ipify
// (api.ipify.org = IPv4, api6.ipify.org = IPv6) e mandam em `?myip=`. Sem
// isso, um PC com IPv4 e IPv6 pode chamar a API por IPv6 sem querer e
// atualizar o registro errado.
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

function routerosInterval(minutes: Interval) {
  return minutes === 60 ? '1h' : `${minutes}m`
}

// Script do RouterOS. `urlExpr` é o miolo de uma string RouterOS que já
// concatena `$ip` (ex.: `https://…?myip=" . $ip . "&format=text`).
// As duas primeiras linhas removem uma versão anterior, então dá pra colar de
// novo por cima sem erro. `/tool fetch` lança erro em 4xx/5xx: cai no
// on-error, loga e não grava o último IP (tenta de novo na próxima rodada).
function mikrotikScript(urlExpr: string, source: 'ipify' | 'wan', interval: string) {
  const getIp =
    source === 'ipify'
      ? ['    :local ip ([/tool fetch url="https://api.ipify.org" output=user as-value]->"data")']
      : [
          '    :local ip [/ip address get [find interface="pppoe-out1"] address]',
          '    :set ip [:pick $ip 0 [:find $ip "/"]]',
        ]

  return [
    '/system scheduler remove [find name="jukre-ddns"]',
    '/system script remove [find name="jukre-ddns"]',
    '/system script add name=jukre-ddns source={',
    '  :global jukreLastIp',
    '  :do {',
    ...getIp,
    '    :if ($ip = $jukreLastIp) do={',
    '      :log info ("JUK.re DDNS: IP sem mudanca (" . $ip . ")")',
    '    } else={',
    `      :local res ([/tool fetch url=("${urlExpr}") output=user as-value]->"data")`,
    '      :log info ("JUK.re DDNS: " . [:pick $res 0 [:find $res "\\n"]])',
    '      :set jukreLastIp $ip',
    '    }',
    '  } on-error={',
    '    :log warning "JUK.re DDNS: falha ao atualizar (sem internet, token invalido ou limite de 5 min)"',
    '  }',
    '}',
    `/system scheduler add name=jukre-ddns interval=${interval} on-event=jukre-ddns`,
  ].join('\n')
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

function IpifyHint() {
  return (
    <p className="host-hint host-hint--block">
      Os comandos consultam o <a href="https://www.ipify.org/" target="_blank" rel="noreferrer" className="host-inline-link">ipify</a>{' '}
      (<code>api.ipify.org</code> devolve o seu IPv4 e <code>api6.ipify.org</code> o IPv6) e mandam o valor em{' '}
      <code>?myip=</code>. Assim um PC com IPv4 e IPv6 nunca atualiza o registro errado.
    </p>
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
  const ipv4Url = `${updateUrl}?myip=`

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
          <IpifyHint />

          <CodeBlock
            lang="bash"
            title="Linux / macOS (cron): IPv4"
            copyable={copyable}
            code={`${cronFor(interval)} curl -fsS "${ipv4Url}$(curl -fsS https://api.ipify.org)" >/dev/null`}
          />

          <CodeBlock
            lang="powershell"
            title="Windows: teste"
            copyable={copyable}
            code={[
              '$ip = Invoke-RestMethod "https://api.ipify.org"',
              `Invoke-RestMethod "${ipv4Url}$ip"`,
            ].join('\n')}
          />

          <CodeBlock
            lang="powershell"
            title={`Windows: agendar a cada ${interval} min`}
            copyable={copyable}
            code={[
              `$acao = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-NoProfile -Command "$ip = Invoke-RestMethod https://api.ipify.org; Invoke-RestMethod (''${ipv4Url}'' + $ip)"'`,
              `$gatilho = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes ${interval}) -RepetitionDuration (New-TimeSpan -Days 3650)`,
              `Register-ScheduledTask -TaskName 'JUKre DDNS' -Action $acao -Trigger $gatilho`,
            ].join('\n')}
          />

          <CodeBlock
            lang="bash"
            title="IPv6 (opcional), Linux / macOS: só se a sua rede tem IPv6 público"
            copyable={copyable}
            code={`curl -fsS "${ipv4Url}$(curl -fsS https://api6.ipify.org)"`}
          />

          <CodeBlock
            lang="powershell"
            title="IPv6 (opcional), Windows"
            copyable={copyable}
            code={['$ip6 = Invoke-RestMethod "https://api6.ipify.org"', `Invoke-RestMethod "${ipv4Url}$ip6"`].join('\n')}
          />
        </>
      )}

      {connector === 'mikrotik' && (
        <>
          <IntervalSelect value={interval} onChange={setIntervalValue} />
          <p className="host-hint host-hint--block">
            O script descobre o IP público no{' '}
            <a href="https://www.ipify.org/" target="_blank" rel="noreferrer" className="host-inline-link">ipify</a>, então funciona
            também atrás de CGNAT ou de outro roteador. Ele só chama a API quando o IP muda e registra cada execução no log do
            RouterOS (prefixo <code>JUK.re DDNS</code>).
          </p>

          <CodeBlock
            lang="routeros"
            title="Terminal ou WinBox → New Terminal"
            copyable={copyable}
            code={mikrotikScript(`${ipv4Url}" . $ip . "&format=text`, 'ipify', routerosInterval(interval))}
          />

          <CodeBlock
            lang="routeros"
            title="Rodar agora e ver o log"
            copyable={copyable}
            code={[
              '# apaga o último IP salvo, pra forçar uma chamada à API',
              '/system script environment remove [find name="jukreLastIp"]',
              '/system script run jukre-ddns',
              '/log print where message~"JUK.re DDNS"',
            ].join('\n')}
          />
          <p className="host-hint">
            No log aparece <code>updated &lt;ip&gt;</code> ou <code>unchanged &lt;ip&gt;</code>, e a chamada aparece no Log de
            requisições do host. <code>IP sem mudanca</code> quer dizer que o script nem chamou a API, porque o IP é o
            mesmo da última vez. Se aparecer <code>falha</code>, confira o token e o acesso do MikroTik à internet.
          </p>

          <CodeBlock
            lang="routeros"
            title="Alternativa: IP público direto na interface de internet (sem ipify)"
            copyable={copyable}
            code={mikrotikScript(`${ipv4Url}" . $ip . "&format=text`, 'wan', routerosInterval(interval))}
          />
          <p className="host-hint">
            Só use esta se a interface de internet recebe um IP público. Troque <code>pppoe-out1</code> pela interface do seu
            MikroTik.
          </p>
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
          <p className="host-hint">Para IPv6, crie uma segunda entrada de DNS dinâmico com o IP de IPv6 da WAN, se o seu firmware permitir.</p>
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
          <p className="host-hint">
            Se o gateway estiver atrás de CGNAT ou de outro roteador, o UniFi manda o IP privado da WAN em <code>%i</code>. Tudo
            bem: a API ignora IP privado e usa o IP público de onde a chamada saiu.
          </p>
        </>
      )}

      {connector === 'ddclient' && (
        <>
          <p className="host-guide-lead">
            Em <code>/etc/ddclient.conf</code>. O <code>daemon=900</code> checa a cada 15 min e só atualiza quando o IP muda.
          </p>
          <CodeBlock
            lang="ini"
            title="/etc/ddclient.conf"
            copyable={copyable}
            code={[
              'daemon=900',
              'use=web',
              'web=https://api.ipify.org',
              '# IPv6 (ddclient 3.10+): descomente as duas linhas abaixo',
              '# usev6=webv6',
              '# webv6=https://api6.ipify.org',
              'protocol=dyndns2',
              `server=${host}`,
              'ssl=yes',
              `login=${fqdn}`,
              `password=${tokenText}`,
              fqdn,
            ].join('\n')}
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
