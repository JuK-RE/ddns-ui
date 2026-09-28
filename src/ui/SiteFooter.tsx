import { SiGithub } from 'react-icons/si'
import { StatusBadge } from '../components/StatusBadge'
import { ThemeToggle } from '../theme/ThemeToggle'
import { ORG_URL } from './links'

/** Rodapé comum: © + status do serviço + tema + GitHub. Usado na landing, no login e no painel. */
export function SiteFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer className={`ui-site-footer${compact ? ' ui-site-footer--compact' : ''}`}>
      <span>© 2026 JUK.re DDNS</span>
      <span className="ui-site-footer-status">
        <StatusBadge />
      </span>
      <span className="ui-site-footer-actions">
        <ThemeToggle />
        <a href={ORG_URL} target="_blank" rel="noreferrer" className="ui-site-footer-link">
          <SiGithub size={14} />
          GitHub
        </a>
      </span>
    </footer>
  )
}
