import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { JucasoftWordmark } from '../components/JucasoftWordmark'

/** Barra superior das páginas públicas (landing e login). */
export function SiteNav({ children }: { children?: ReactNode }) {
  return (
    <nav className="ui-site-nav">
      <Link to="/home" aria-label="JUCA Soft — página inicial" className="ui-site-nav-brand">
        <JucasoftWordmark height={22} />
      </Link>
      <div className="ui-site-nav-actions">{children}</div>
    </nav>
  )
}
