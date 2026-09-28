import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CodeBlock } from '../components/hosts/CodeBlock'
import { CopyButton } from '../components/hosts/CopyButton'
import type { Block } from './markdown'

// Links: "/rota" vira <Link>; http(s)/mailto abrem em outra aba; qualquer outra
// coisa (inclusive javascript:) é mostrada como texto puro.
const INLINE_RE = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*\s][^*]*\*|\[[^\]]+\]\([^)\s]+\))/g

function renderInline(text: string): ReactNode[] {
  return text.split(INLINE_RE).map((part, i) => {
    if (!part) return null
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i}>{part.slice(1, -1)}</code>
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{renderInline(part.slice(2, -2))}</strong>
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={i}>{renderInline(part.slice(1, -1))}</em>

    const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/)
    if (link) {
      const [, label, href] = link
      if (href.startsWith('/') && !href.startsWith('//')) return <Link key={i} to={href}>{label}</Link>
      if (href.startsWith('#')) return <a key={i} href={href}>{label}</a>
      if (/^(https?:|mailto:)/i.test(href)) return <a key={i} href={href} target="_blank" rel="noreferrer">{label}</a>
      return <Fragment key={i}>{label}</Fragment>
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}

// Célula de tabela que é só um `código` (URL, usuário…) ganha botão de copiar.
function renderCell(text: string): ReactNode {
  const only = text.match(/^`([^`]+)`$/)
  if (!only) return renderInline(text)
  return (
    <span className="docs-copy-cell">
      <code>{only[1]}</code>
      <CopyButton text={only[1]} label="Copiar valor" />
    </span>
  )
}

// Só imagens do próprio site ou https.
const safeSrc = (src: string) => (src.startsWith('/') && !src.startsWith('//')) || src.startsWith('https://')

export function Markdown({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'heading': {
            const Tag = `h${b.level}` as 'h1' | 'h2' | 'h3'
            return (
              <Tag key={i} id={b.id}>
                {renderInline(b.text)}
              </Tag>
            )
          }
          case 'paragraph':
            return <p key={i}>{renderInline(b.text)}</p>
          case 'list': {
            const Tag = b.ordered ? 'ol' : 'ul'
            return (
              <Tag key={i}>
                {b.items.map((item, j) => (
                  <li key={j}>{renderInline(item)}</li>
                ))}
              </Tag>
            )
          }
          case 'code':
            return (
              <CodeBlock key={i} code={b.code} lang={b.lang || undefined} title={b.title || undefined} />
            )
          case 'quote':
            return <blockquote key={i}>{renderInline(b.text)}</blockquote>
          case 'image':
            return safeSrc(b.src) ? (
              <figure key={i}>
                <img src={b.src} alt={b.alt} loading="lazy" />
                {b.alt && <figcaption>{b.alt}</figcaption>}
              </figure>
            ) : null
          case 'table':
            return (
              <div key={i} className="docs-table-wrap">
                <table>
                  <thead>
                    <tr>
                      {b.head.map((h, j) => (
                        <th key={j}>{renderInline(h)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((row, r) => (
                      <tr key={r}>
                        {row.map((cell, c) => (
                          <td key={c}>{renderCell(cell)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          case 'hr':
            return <hr key={i} />
        }
      })}
    </>
  )
}
