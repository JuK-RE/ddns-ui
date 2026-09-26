// Fonte única dos dados de SEO — usada pelo app (títulos/meta por página)
// e pelo vite.config.ts (index.html, robots.txt, sitemap.xml, llms.txt).
// Por isso este arquivo não pode importar nada do React/browser.

/** Domínio de produção. Pode ser trocado com VITE_SITE_URL no .env. */
export const DEFAULT_SITE_URL = 'https://ddns.juk.re'

export const SITE_NAME = 'JUK.re DDNS'
export const SITE_TITLE = 'JUK.re DDNS · Dynamic DNS open source'
export const SITE_DESCRIPTION =
  'Tenha um endereço fixo pra sua rede mesmo com IP dinâmico. DDNS open source e simples de configurar, com suporte a MikroTik, UniFi, pfSense e mais.'
export const SITE_LOCALE = 'pt_BR'
export const SITE_LANG = 'pt-BR'
export const THEME_COLOR = '#ff5e1f'
export const OG_IMAGE_PATH = '/og-image.png'
export const REPO_URL = 'https://github.com/JuK-RE/ddns'
export const COMPANY_URL = 'https://www.jucasoft.com.br/'

/** Páginas públicas que entram no sitemap. */
export const PUBLIC_ROUTES: { path: string; changefreq: 'daily' | 'weekly' | 'monthly'; priority: number }[] = [
  { path: '/', changefreq: 'weekly', priority: 1 },
]

/** Rotas que não devem ser indexadas (login e painel). */
export const PRIVATE_ROUTES = ['/auth', '/sessions', '/versions', '/profile']

/** Remove a barra final pra montar URLs sem "//". */
export function normalizeSiteUrl(url: string) {
  return url.replace(/\/+$/, '')
}
