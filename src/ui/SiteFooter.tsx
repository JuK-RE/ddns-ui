import { StatusBadge } from '../components/StatusBadge'
import { ThemeToggle } from '../theme/ThemeToggle'

/** Rodapé comum: © + status do serviço + tema. Usado na landing, no login e no
    painel. O GitHub já aparece na nav/hero — aqui só duplicava. No mobile o
    seletor de tema muda pra header (SiteNav/topbar): ver ui.css e Docs.css. */
export function SiteFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer className={`ui-site-footer${compact ? ' ui-site-footer--compact' : ''}`}>
      <span>© 2026 JUK.re DDNS</span>
      <span className="ui-site-footer-status">
        <StatusBadge />
      </span>
      <span className="ui-site-footer-actions">
        <ThemeToggle />
      </span>
    </footer>
  )
}
