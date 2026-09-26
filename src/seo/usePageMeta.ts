import { useEffect } from 'react'
import { DEFAULT_SITE_URL, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, normalizeSiteUrl } from './site'

export const SITE_URL = normalizeSiteUrl((import.meta.env.VITE_SITE_URL as string | undefined) || DEFAULT_SITE_URL)

type PageMeta = {
  /** Título da página. Vira "Título · JUK.re DDNS"; sem título usa o título padrão do site. */
  title?: string
  description?: string
  /** Caminho canônico (ex.: "/"). Sem ele, a página não publica canonical/og:url próprios. */
  path?: string
  /** true = não indexar (login, painel). */
  noindex?: boolean
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.rel = 'canonical'
    document.head.appendChild(el)
  }
  el.href = href
}

/**
 * Atualiza <title>, description, robots, canonical e as tags de
 * compartilhamento (Open Graph/Twitter) da página atual. O index.html já
 * sai com os valores da landing — isso ajusta quando a rota muda.
 */
export function usePageMeta({ title, description = SITE_DESCRIPTION, path, noindex = false }: PageMeta) {
  useEffect(() => {
    const fullTitle = title ? `${title} · ${SITE_NAME}` : SITE_TITLE

    document.title = fullTitle
    setMeta('name', 'description', description)
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large')
    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', description)
    setMeta('name', 'twitter:title', fullTitle)
    setMeta('name', 'twitter:description', description)

    if (path) {
      const url = `${SITE_URL}${path}`
      setCanonical(url)
      setMeta('property', 'og:url', url)
    }
  }, [title, description, path, noindex])
}
