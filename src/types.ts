export type User = {
  id: number
  username: string | null
  email: string | null
  name: string | null
  avatar_url: string | null
  created_at: string
  /** Administrador (ADMIN_EMAILS no backend): vê a página de Versões. */
  is_admin?: boolean
}

export type Session = {
  id: string
  provider: string
  created_at: string
  expires_at: string
  revoked_at: string | null
  /** true = sessão deste navegador ("este dispositivo"). */
  current?: boolean
}

// ─── Hosts DDNS ────────────────────────────────────────────────────────

/** Como o aparelho avisa a API do IP novo (só muda o tutorial exibido). */
export type Connector = 'http' | 'mikrotik' | 'pfsense' | 'unifi' | 'ddclient' | 'cli'

export type Zone = {
  id: number
  /** Ex.: "ip.juk.re". */
  suffix: string
  description: string | null
}

export type Host = {
  id: string
  /** Nome interno ("Clínica Asa Sul"). */
  label: string
  /** Subdomínio ("clinicajuca"). */
  name: string
  /** Zona ("ip.juk.re"). */
  zone: string
  /** Endereço completo ("clinicajuca.ip.juk.re"). */
  fqdn: string
  connector: Connector
  /** Só o começo do token ("jukre_Q2x9"), pra reconhecer no painel. */
  token_prefix: string
  /** false = DDNS pausado: o conector não altera mais o IP (só edição manual). */
  ddns_enabled: boolean
  last_ipv4: string | null
  last_ipv6: string | null
  /** ISO 8601. Só é regravada de hora em hora quando o IP não muda. */
  last_check_at: string | null
  last_change_at: string | null
  last_user_agent: string | null
  created_at: string
}

export type HostStatus = 'pending' | 'online' | 'stale' | 'offline' | 'paused'

export type HostHistoryEntry = {
  id: number
  record_type: string
  old_ip: string | null
  new_ip: string
  /** "v1" | "dyndns2" | "cli" | "manual" (edição pelo painel). */
  source: string
  user_agent: string | null
  created_at: string
}

/** Resultado de uma chamada à API de atualização (/v1/update ou /nic/update). */
export type HostLogResult = 'updated' | 'unchanged' | 'disabled' | 'rate_limited' | 'nohost' | 'bad_ip' | 'error'

/** Uma das últimas 30 chamadas do conector (log de requisições). */
export type HostLogEntry = {
  id: number
  /** "v1" | "dyndns2". */
  source: string
  result: HostLogResult
  /** Status HTTP devolvido ao conector. */
  status: number
  record_type: string | null
  /** IP que a chamada pediu pra gravar. */
  ip: string | null
  /** IP de onde a chamada saiu. */
  caller_ip: string | null
  user_agent: string | null
  message: string | null
  created_at: string
}

export type Availability =
  | { available: true }
  | { available: false; reason: 'invalid' | 'reserved' | 'taken'; message?: string }
  | { available: false; reason: 'quarantine'; available_at: string }
