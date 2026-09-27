import { Server, Terminal, type LucideIcon } from 'lucide-react'
import { SiMikrotik, SiPfsense, SiUbiquiti } from 'react-icons/si'
import type { IconType } from 'react-icons'
import type { Connector } from '../../types'

export type ConnectorMeta = {
  id: Connector
  title: string
  description: string
  icon: LucideIcon | IconType
  /** Ainda não disponível (CLI em Go → fase 2). */
  soon?: boolean
}

export const CONNECTORS: ConnectorMeta[] = [
  { id: 'http', title: 'API / HTTP', description: 'curl, PowerShell e cron em qualquer PC ou servidor.', icon: Terminal },
  { id: 'mikrotik', title: 'MikroTik', description: 'Script + scheduler no RouterOS.', icon: SiMikrotik },
  { id: 'pfsense', title: 'pfSense / OPNsense', description: 'DNS dinâmico nativo (dyndns2).', icon: SiPfsense },
  { id: 'unifi', title: 'UniFi', description: 'DNS dinâmico personalizado no gateway.', icon: SiUbiquiti },
  { id: 'ddclient', title: 'ddclient', description: 'Linux e NAS, via dyndns2.', icon: Server },
  { id: 'cli', title: 'CLI', description: 'Cliente em Go que roda como serviço.', icon: Terminal, soon: true },
]

export function connectorMeta(id: Connector): ConnectorMeta {
  return CONNECTORS.find((c) => c.id === id) ?? CONNECTORS[0]
}
