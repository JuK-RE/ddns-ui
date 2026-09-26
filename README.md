# ddns-ui

Front do **JUK.re DDNS** (Vite + React + TypeScript): landing em `/` e `/home`, login em `/auth` e painel em `/`, `/sessions`, `/versions` e `/profile` (logado).

## Rodando local

```bash
pnpm install
cp .env.example .env   # ajuste VITE_API_PROXY_TARGET se o backend não estiver em localhost:8787
pnpm dev
```

## Como o front fala com a API

O navegador **só conversa com o próprio domínio**. Toda chamada vai para `/api/...` e quem repassa para o backend (o Worker `ddns-api`) é um proxy:

```
navegador ──► ddns.juk.re/api/auth/me ──(proxy)──► Worker ddns-api /api/auth/me
```

Por quê:

- **O endereço do backend não aparece no site** (nem no HTML, nem no bundle JS).
- **A sessão é um cookie `httpOnly` + `Secure` + `SameSite=Lax`** no domínio do front, setado pelo backend. O JavaScript nunca vê o token: nada de `#token=` na URL nem de token no `localStorage`, então um XSS não consegue roubar a sessão.
- **Sem cookie cross-site nem CORS com credenciais**, porque tudo é mesma origem.

No código, a base é fixa em `/api` (`src/lib/api.ts`). O único estado no `localStorage` é `ddns_has_session`, uma dica sem nada sensível que serve só pra UI mostrar "carregando" em vez de piscar a landing.

### Dev

O `vite.config.ts` já tem o proxy `/api` (vale no `pnpm dev` e no `pnpm preview`). O alvo vem de `VITE_API_PROXY_TARGET` (padrão `http://localhost:8787`). Se o `.env` ainda tiver o `VITE_API_URL` antigo com URL absoluta, ela é usada como alvo do proxy, e o front continua chamando só `/api`.

### Produção (Vercel)

O `vercel.json` já faz as duas coisas:

- repassa `/api/*` pro Worker (`https://gateway.juk.re/api/*`) mantendo o caminho `/api/...`. Se o domínio do Worker mudar, troque ali;
- serve o `index.html` pras rotas do SPA (`/auth`, `/sessions`…). Arquivos estáticos (`robots.txt`, `sitemap.xml`, ícones) têm prioridade.

Também adiciona alguns cabeçalhos de segurança (`nosniff`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`).

Na Vercel, defina `VITE_SITE_URL=https://ddns.juk.re` se quiser deixar explícito (já é o padrão).

### Checklist do backend (ddns-api)

- `FRONTEND_URL` = URL pública do front, sem barra no fim (ex.: `https://ddns.juk.re`).
- Google Cloud Console → URIs de redirecionamento autorizadas: `FRONTEND_URL/api/auth/google`.
- GitHub → OAuth App → Authorization callback URL: `FRONTEND_URL/api/auth/github`.
- Deploy do front e do backend juntos: o front novo não lê mais `#token=` e o backend novo não manda mais.

## Scripts

- `pnpm dev`: servidor de desenvolvimento (com proxy `/api`).
- `pnpm build`: build de produção (gera também `robots.txt`, `sitemap.xml` e `llms.txt`).
- `pnpm preview`: serve o build (com proxy `/api`).
- `pnpm lint`: ESLint.
