import { api } from './api'
import type { Availability, Connector, Host, HostHistoryEntry, HostStatus, Zone } from '../types'

// Chamadas do painel de hosts. Tudo pelo `api` (axios em /api, com o cookie
// de sessão). O token do host só existe na resposta de createHost/regenerateToken
// e na memória da tela que o exibe — nunca é guardado.

export const MAX_HOSTS = 5

export async function listZones(): Promise<Zone[]> {
  const { data } = await api.get<{ zones: Zone[] }>('/zones')
  return data.zones
}

export async function checkAvailability(name: string, zone: string): Promise<Availability> {
  const { data } = await api.get<Availability>('/hosts/availability', { params: { name, zone } })
  return data
}

export async function listHosts(): Promise<{ hosts: Host[]; limit: number; used: number }> {
  const { data } = await api.get<{ hosts: Host[]; limit: number; used: number }>('/hosts')
  return data
}

export async function createHost(input: {
  label: string
  name: string
  zone: string
  connector: Connector
}): Promise<{ host: Host; token: string }> {
  const { data } = await api.post<{ host: Host; token: string }>('/hosts', input)
  return data
}

export async function getHost(id: string): Promise<Host> {
  const { data } = await api.get<{ host: Host }>(`/hosts/${id}`)
  return data.host
}

export async function updateHost(id: string, patch: { label?: string; connector?: Connector }): Promise<Host> {
  const { data } = await api.patch<{ host: Host }>(`/hosts/${id}`, patch)
  return data.host
}

/** Página DNS: liga/desliga o DDNS e edita o IPv4/IPv6 na mão (`null` remove o registro). */
export async function updateDns(
  id: string,
  patch: { ddns_enabled?: boolean; ipv4?: string | null; ipv6?: string | null }
): Promise<Host> {
  const { data } = await api.patch<{ host: Host }>(`/hosts/${id}/dns`, patch)
  return data.host
}

export async function regenerateToken(id: string): Promise<{ token: string; token_prefix: string }> {
  const { data } = await api.post<{ token: string; token_prefix: string }>(`/hosts/${id}/token`)
  return data
}

export async function deleteHost(id: string): Promise<{ available_at: string }> {
  const { data } = await api.delete<{ ok: true; available_at: string }>(`/hosts/${id}`)
  return data
}

export async function getHistory(id: string, limit = 50): Promise<HostHistoryEntry[]> {
  const { data } = await api.get<{ history: HostHistoryEntry[] }>(`/hosts/${id}/history`, { params: { limit } })
  return data.history
}

/** Mensagem de erro (e código, se houver) de uma resposta da API. */
export function apiError(err: unknown, fallback: string): { message: string; code?: string; availableAt?: string } {
  const data = (err as { response?: { data?: { error?: string; code?: string; available_at?: string } } }).response
    ?.data
  return { message: data?.error ?? fallback, code: data?.code, availableAt: data?.available_at }
}

// ─── Status (calculado no front) ───────────────────────────────────────
// Margens largas de propósito: o padrão dos tutoriais é 15 min e o backend
// só grava "última verificação" de hora em hora quando o IP não muda.
const ONLINE_MS = 90 * 60 * 1000
const STALE_MS = 24 * 60 * 60 * 1000

export function hostStatus(host: Pick<Host, 'last_check_at' | 'ddns_enabled'>, now: number): HostStatus {
  if (!host.ddns_enabled) return 'paused'
  if (!host.last_check_at) return 'pending'
  const age = now - new Date(host.last_check_at).getTime()
  if (age < ONLINE_MS) return 'online'
  if (age < STALE_MS) return 'stale'
  return 'offline'
}

export const STATUS_LABEL: Record<HostStatus, string> = {
  pending: 'Aguardando conexão',
  online: 'Online',
  stale: 'Sem contato',
  offline: 'Offline',
  paused: 'DDNS pausado',
}

export const CONNECTOR_LABEL: Record<Connector, string> = {
  http: 'API / HTTP',
  mikrotik: 'MikroTik',
  pfsense: 'pfSense / OPNsense',
  unifi: 'UniFi',
  ddclient: 'ddclient',
  cli: 'CLI',
}
