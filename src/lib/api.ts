import axios from 'axios'

// O front só fala com o próprio domínio: tudo vai pra "/api/...", e quem
// repassa pro backend é o proxy (Vite no dev, a hospedagem em produção —
// ver README). Assim o endereço real da API não aparece no site, e o
// cookie de sessão fica no mesmo domínio do front (sem cookie cross-site).
//
// Fixo em "/api" de propósito: nenhum endereço de backend entra no bundle.
// (O VITE_API_URL antigo, se ainda estiver no .env, só é usado pelo
// vite.config.ts como alvo do proxy — nunca chega aqui.)
export const API_URL = '/api'

// Sessão: cookie httpOnly setado pelo backend. O JavaScript nunca lê nem
// guarda o token — `withCredentials` só garante que o cookie vá junto.
export const api = axios.create({ baseURL: API_URL, withCredentials: true })

// Dica (não sensível) de que existe uma sessão aberta neste navegador. Serve
// só pra UI: mostrar "carregando" em vez de piscar a landing enquanto o
// /auth/me responde. Quem decide se está logado é sempre o backend.
const SESSION_HINT_KEY = 'ddns_has_session'

export function hasSessionHint(): boolean {
  try {
    return localStorage.getItem(SESSION_HINT_KEY) === '1'
  } catch {
    return false
  }
}

export function setSessionHint(active: boolean) {
  try {
    if (active) localStorage.setItem(SESSION_HINT_KEY, '1')
    else localStorage.removeItem(SESSION_HINT_KEY)
  } catch {
    // sem storage (modo privado etc.) — só perde o "carregando"
  }
}

// Limpa o token que versões antigas do front guardavam no localStorage.
try {
  localStorage.removeItem('ddns_token')
} catch {
  // ignora
}
