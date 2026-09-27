export type User = {
  id: number
  username: string | null
  email: string | null
  name: string | null
  avatar_url: string | null
  created_at: string
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
  last_ipv4: string | null
  /** ISO 8601. Só é regravada de hora em hora quando o IP não muda. */
  last_check_at: string | null
  last_change_at: string | null
  last_user_agent: string | null
  created_at: string
}

export type HostStatus = 'pending' | 'online' | 'stale' | 'offline'

export type HostHistoryEntry = {
  id: number
  record_type: string
  old_ip: string | null
  new_ip: string
  /** "v1" | "dyndns2" | "cli". */
  source: string
  user_agent: string | null
  created_at: string
}

export type Availability =
  | { available: true }
  | { available: false; reason: 'invalid' | 'reserved' | 'taken'; message?: string }
  | { available: false; reason: 'quarantine'; available_at: string }
