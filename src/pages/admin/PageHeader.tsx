import type { ReactNode } from 'react'
import { Eyebrow } from '../../ui'
import { usePageMeta } from '../../seo/usePageMeta'

export function PageHeader({
  title,
  description,
  actions,
  eyebrow = 'Painel',
}: {
  title: string
  description?: string
  actions?: ReactNode
  eyebrow?: string
}) {
  // Páginas do painel: título próprio na aba e nunca indexadas.
  usePageMeta({ title, noindex: true })

  return (
    <div className="admin-page-header">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="admin-page-actions">{actions}</div>}
    </div>
  )
}
