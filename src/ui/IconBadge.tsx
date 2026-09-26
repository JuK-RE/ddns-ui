import type { ReactNode } from 'react'

/** Quadradinho laranja-claro com ícone (o mesmo dos itens de segurança/compatibilidade da landing). */
export function IconBadge({ children, size = 'md' }: { children: ReactNode; size?: 'sm' | 'md' | 'lg' }) {
  return <span className={`ui-icon-badge ui-icon-badge--${size}`}>{children}</span>
}
