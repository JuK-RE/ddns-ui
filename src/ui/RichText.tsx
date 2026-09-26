import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

// [texto](url) — url começando com "/" vira rota interna; http(s)/mailto vira link externo.
const LINK_RE = /\[([^\]]+)\]\(([^)\s]+)\)/g

function isExternal(href: string) {
  return /^(https?:|mailto:)/i.test(href)
}

/**
 * Texto simples com suporte a links no formato markdown `[texto](url)`.
 *
 * - `/rota`             → <Link> do react-router (navega sem recarregar)
 * - `https://…`/`mailto:` → <a target="_blank"> com ícone de link externo
 *
 * Qualquer outra coisa (inclusive `javascript:`) é renderizada como texto
 * puro, então dá pra usar com conteúdo vindo de config sem risco de XSS.
 */
export function RichText({ text, linkClassName = 'ui-rich-link' }: { text: string; linkClassName?: string }) {
  const parts: ReactNode[] = []
  let last = 0

  for (const match of text.matchAll(LINK_RE)) {
    const [raw, label, href] = match
    const start = match.index ?? 0
    if (start > last) parts.push(text.slice(last, start))

    if (href.startsWith('/') && !href.startsWith('//')) {
      parts.push(
        <Link key={start} to={href} className={linkClassName}>
          {label}
        </Link>,
      )
    } else if (isExternal(href)) {
      parts.push(
        <a key={start} href={href} target="_blank" rel="noreferrer noopener" className={`${linkClassName} is-external`}>
          {label}
          <ArrowUpRight size={12} aria-hidden="true" />
          <span className="sr-only"> (abre em nova aba)</span>
        </a>,
      )
    } else {
      parts.push(raw)
    }

    last = start + raw.length
  }

  if (last < text.length) parts.push(text.slice(last))

  return <>{parts.map((part, i) => (typeof part === 'string' ? <Fragment key={`t${i}`}>{part}</Fragment> : part))}</>
}
