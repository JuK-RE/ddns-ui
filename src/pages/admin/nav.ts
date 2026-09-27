import { Globe, History, LayoutDashboard, Network, UserRound, type LucideIcon } from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  /** Palavras extras pra busca da sidebar (Ctrl K). */
  keywords?: string
  badge?: string
  disabled?: boolean
  /** Só administradores (ADMIN_EMAILS) enxergam este item. */
  adminOnly?: boolean
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Visão geral', icon: LayoutDashboard, keywords: 'dashboard inicio home painel' },
  { to: '/hosts', label: 'Hosts', icon: Globe, keywords: 'dominios dns registros ip' },
  { to: '/dns', label: 'DNS', icon: Network, keywords: 'registros ip ipv4 ipv6 ddns ativo editar' },
  { to: '/versions', label: 'Versões', icon: History, keywords: 'release changelog historico', adminOnly: true },
  { to: '/profile', label: 'Meu perfil', icon: UserRound, keywords: 'conta usuario sessoes dispositivos logout' },
]

function normalize(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function filterNav(query: string, isAdmin = false): NavItem[] {
  const q = normalize(query.trim())
  const visible = navItems.filter((item) => !item.adminOnly || isAdmin)
  if (!q) return visible
  return visible.filter((item) => normalize(`${item.label} ${item.keywords ?? ''}`).includes(q))
}
