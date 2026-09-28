import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ChevronDown, ExternalLink } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { DEFAULT_DOC, DOC_PAGES } from '../../docs'
// Nome sem ambiguidade de maiúsculas com './markdown' (o parser) — em
// filesystem case-insensitive (Windows/macOS) 'Markdown' e 'markdown.ts'
// colidem na resolução de módulo sem extensão e o bundler pode carregar o
// arquivo errado. Ver src/docs/MarkdownRenderer.tsx.
import { Markdown } from '../../docs/MarkdownRenderer'
import { parseMarkdown, tocOf } from '../../docs/markdown'
import { usePageMeta } from '../../seo/usePageMeta'
import { ButtonLink, SiteFooter, SUPPORT_URL } from '../../ui'
import { JukWordmark } from '../../components/JukWordmark'
import '../../App.css'
import './Docs.css'

// Documentação pública em /docs e /docs/:slug. O conteúdo vem dos .md de
// src/docs (ver docs/index.ts). Layout de 3 colunas: páginas · texto · "Nesta página".
export function DocsPage() {
  const { slug } = useParams()
  const { user } = useAuth()
  const [navOpen, setNavOpen] = useState(false)

  // Nova página → fecha o menu de navegação mobile (ver .docs-nav-toggle no
  // Docs.css). Ajuste de estado durante o render em vez de setState num
  // effect (mesmo padrão do AdminLayout).
  const [lastSlug, setLastSlug] = useState(slug)
  if (lastSlug !== slug) {
    setLastSlug(slug)
    setNavOpen(false)
  }

  const page = slug ? DOC_PAGES.find((p) => p.slug === slug) : DEFAULT_DOC
  const index = page ? DOC_PAGES.indexOf(page) : -1

  const blocks = useMemo(() => (page ? parseMarkdown(page.content) : []), [page])
  const toc = useMemo(() => tocOf(blocks), [blocks])

  usePageMeta({
    title: page ? `${page.title} · Docs` : 'Docs',
    description: page?.description,
    path: page ? (slug ? `/docs/${page.slug}` : '/docs') : '/docs',
  })

  // Nova página → volta ao topo (ou vai pro #âncora, se a URL tiver uma).
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash) document.getElementById(hash)?.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [slug])

  if (!page) return <Navigate to="/docs" replace />

  const groups = [...new Set(DOC_PAGES.map((p) => p.group))]
  const prev = DOC_PAGES[index - 1]
  const next = DOC_PAGES[index + 1]

  return (
    <div className="docs-shell">
      <header className="docs-topbar">
        <div className="docs-topbar-left">
          <Link to="/home" aria-label="JUK.re DDNS — página inicial" className="docs-brand">
            <JukWordmark height={14} />
          </Link>
          <span className="docs-topbar-tag">Docs</span>
        </div>
        <div className="docs-topbar-right">
          <a className="docs-top-link" href={SUPPORT_URL} target="_blank" rel="noreferrer">
            <span>Suporte</span> <ExternalLink size={12} />
          </a>
          <ButtonLink to="/" size="sm">
            {user ? 'Abrir painel' : 'Entrar'}
          </ButtonLink>
        </div>
      </header>

      <div className="docs-body">
        <button
          type="button"
          className="docs-nav-toggle"
          aria-expanded={navOpen}
          aria-controls="docs-nav-list"
          onClick={() => setNavOpen((open) => !open)}
        >
          <span>{page.title}</span>
          <ChevronDown size={16} className="docs-nav-toggle-chevron" />
        </button>

        <nav id="docs-nav-list" className={`docs-nav${navOpen ? ' is-open' : ''}`} aria-label="Páginas da documentação">
          {groups.map((group) => (
            <div key={group} className="docs-nav-group">
              <span className="docs-nav-title">{group}</span>
              {DOC_PAGES.filter((p) => p.group === group).map((p) => (
                <Link
                  key={p.slug}
                  to={p === DEFAULT_DOC ? '/docs' : `/docs/${p.slug}`}
                  className={`docs-nav-link${p === page ? ' is-active' : ''}`}
                  aria-current={p === page ? 'page' : undefined}
                >
                  {p.title}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <article className="docs-article">
          <Markdown blocks={blocks} />

          <footer className="docs-pager">
            {prev ? (
              <Link to={prev === DEFAULT_DOC ? '/docs' : `/docs/${prev.slug}`} className="docs-pager-link">
                <ArrowLeft size={14} />
                <span>
                  <small>Anterior</small>
                  {prev.title}
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link to={`/docs/${next.slug}`} className="docs-pager-link docs-pager-link--next">
                <span>
                  <small>Próxima</small>
                  {next.title}
                </span>
                <ArrowRight size={14} />
              </Link>
            )}
          </footer>
        </article>

        <aside className="docs-toc" aria-label="Nesta página">
          {toc.length > 0 && (
            <>
              <span className="docs-nav-title">Nesta página</span>
              {toc.map((t) => (
                <a key={t.id} href={`#${t.id}`} className={t.level === 3 ? 'is-sub' : ''}>
                  {t.text}
                </a>
              ))}
            </>
          )}
        </aside>
      </div>

      <SiteFooter compact />
    </div>
  )
}
