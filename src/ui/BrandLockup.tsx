import { JukWordmark } from '../components/JukWordmark'

/**
 * Assinatura do produto: "JUK.re | DDNS". Wordmark em tinta escura + tag
 * mono laranja — é o que aparece no hero da landing, no card de login e
 * na topbar do painel.
 */
export function BrandLockup({ height = 13, boxed = false }: { height?: number; boxed?: boolean }) {
  return (
    <span className={`ui-lockup${boxed ? ' ui-lockup--boxed' : ''}`}>
      <JukWordmark height={height} />
      <span className="ui-lockup-divider" aria-hidden="true" />
      <span className="ui-lockup-tag">DDNS</span>
    </span>
  )
}
