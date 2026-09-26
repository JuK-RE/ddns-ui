import { loadEnv, type Plugin } from 'vite'
import {
  COMPANY_URL,
  DEFAULT_SITE_URL,
  PRIVATE_ROUTES,
  PUBLIC_ROUTES,
  REPO_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  normalizeSiteUrl,
} from './src/seo/site.ts'
import { faqs } from './src/content/faqs.ts'

/**
 * SEO do ddns-ui:
 * - mantém o index.html estático (títulos, Open Graph e JSON-LD já escritos
 *   nele) e só troca o domínio quando VITE_SITE_URL for diferente do padrão;
 * - gera robots.txt, sitemap.xml e llms.txt (+ llm.txt) com o domínio de
 *   VITE_SITE_URL (padrão https://ddns.juk.re): servidos no `vite dev` e
 *   emitidos no `vite build`;
 * - expõe VITE_SITE_URL já normalizado pro app (usePageMeta).
 */
export function seoPlugin(): Plugin {
  let siteUrl = DEFAULT_SITE_URL

  function robotsTxt() {
    // /auth fica rastreável de propósito: ele já tem <meta robots noindex>,
    // e bloquear no robots impediria o Google de ler esse noindex. As rotas
    // do painel só existem logado, então nem vale o rastreio.
    const disallow = PRIVATE_ROUTES.filter((route) => route !== '/auth')
    return [
      '# JUK.re DDNS',
      'User-agent: *',
      'Allow: /',
      ...disallow.map((route) => `Disallow: ${route}`),
      '',
      `Sitemap: ${siteUrl}/sitemap.xml`,
      '',
    ].join('\n')
  }

  function sitemapXml() {
    const lastmod = new Date().toISOString().slice(0, 10)
    const urls = PUBLIC_ROUTES.map(
      (route) =>
        `  <url>\n    <loc>${siteUrl}${route.path}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${route.changefreq}</changefreq>\n    <priority>${route.priority.toFixed(1)}</priority>\n  </url>`,
    )
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
  }

  // https://llmstxt.org — resumo em Markdown pra assistentes de IA.
  function llmsTxt() {
    return `# ${SITE_NAME}

> DDNS (Dynamic DNS) open source. Mantém um domínio apontando pro IP da sua rede, mesmo quando a operadora troca esse IP.

O ${SITE_NAME} é um projeto da [JUCA Soft](${COMPANY_URL}). O site está em português (pt-BR).

## Como funciona

- Um cliente (CLI em Go) ou o próprio roteador confere o IP público de tempos em tempos.
- Quando o IP muda, o registro de DNS é atualizado na hora. Se não mudou, nada é enviado.
- Cada mudança fica registrada no histórico, com data.

## Compatibilidade

MikroTik, UniFi, pfSense, TP-Link, Windows Server, Ubuntu e qualquer aparelho capaz de fazer uma requisição HTTP.

## Preço

Gratuito pra uso pessoal. Pra uso comercial, o contato é com a [JUCA Soft](${COMPANY_URL}).

## Links

- [Página inicial](${siteUrl}/): apresentação do serviço
- [Código-fonte](${REPO_URL}): repositório no GitHub (open source)
- [JUCA Soft](${COMPANY_URL}): empresa responsável; contato para uso comercial

## Perguntas frequentes

${faqs.map((item) => `### ${item.q}\n\n${item.a}`).join('\n\n')}
`
  }

  function files(): Record<string, { type: string; body: () => string }> {
    return {
      'robots.txt': { type: 'text/plain; charset=utf-8', body: robotsTxt },
      'sitemap.xml': { type: 'application/xml; charset=utf-8', body: sitemapXml },
      'llms.txt': { type: 'text/markdown; charset=utf-8', body: llmsTxt },
      'llm.txt': { type: 'text/markdown; charset=utf-8', body: llmsTxt },
    }
  }

  return {
    name: 'juk-seo',

    config(_config, { mode }) {
      const env = loadEnv(mode, process.cwd(), 'VITE_')
      siteUrl = normalizeSiteUrl(env.VITE_SITE_URL || DEFAULT_SITE_URL)
      return { define: { 'import.meta.env.VITE_SITE_URL': JSON.stringify(siteUrl) } }
    },

    // O index.html é estático (sem placeholders) pra que robôs sem JS leiam
    // tudo direto. Aqui só: (1) troca o domínio se VITE_SITE_URL for outro;
    // (2) avisa se título/descrição saíram de sincronia com src/seo/site.ts.
    transformIndexHtml(html) {
      const missing = [SITE_TITLE, SITE_DESCRIPTION].filter((text) => !html.includes(text))
      if (missing.length) {
        console.warn(`[juk-seo] index.html fora de sincronia com src/seo/site.ts: ${missing.join(' | ')}`)
      }
      if (siteUrl === normalizeSiteUrl(DEFAULT_SITE_URL)) return html
      return html.replaceAll(normalizeSiteUrl(DEFAULT_SITE_URL), siteUrl)
    },

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const name = req.url?.split('?')[0].replace(/^\//, '') ?? ''
        const file = files()[name]
        if (!file) return next()
        res.setHeader('Content-Type', file.type)
        res.end(file.body())
      })
    },

    generateBundle() {
      for (const [fileName, file] of Object.entries(files())) {
        this.emitFile({ type: 'asset', fileName, source: file.body() })
      }
    },
  }
}
