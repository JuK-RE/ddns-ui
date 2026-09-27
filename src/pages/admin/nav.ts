import { Globe, History, LayoutDashboard, MonitorSmartphone, UserRound, type LucideIcon } from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  /** Palavras extras pra busca da sidebar (Ctrl K). */
  keywords?: string
  badge?: string
  disabled?: boolean
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Visão geral', icon: LayoutDashboard, keywords: 'dashboard inicio home painel' },
  { to: '/hosts', label: 'Hosts', icon: Globe, keywords: 'dominios dns registros ip' },
  { to: '/sessions', label: 'Sessões', icon: MonitorSmartphone, keywords: 'dispositivos login logout revogar' },
  { to: '/versions', label: 'Versões', icon: History, keywords: 'release changelog historico' },
  { to: '/profile', label: 'Meu perfil', icon: UserRound, keywords: 'conta usuario debug' },
]

function normalize(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function filterNav(query: string): NavItem[] {
  const q = normalize(query.trim())
  if (!q) return navItems
  return navItems.filter((item) => normalize(`${item.label} ${item.keywords ?? ''}`).includes(q))
}
