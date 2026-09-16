import axios from 'axios'

// Sempre absoluta — usada também pro link de login (navegação de
// verdade, não passa pelo axios).
export const API_URL = import.meta.env.VITE_API_URL as string | undefined

if (!API_URL) {
  // eslint-disable-next-line no-console
  console.error('VITE_API_URL não definida. Confira o .env do ddns-ui.')
}

const TOKEN_KEY = 'ddns_token'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function hasStoredToken(): boolean {
  return !!getToken()
}

export function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // localStorage pode falhar (modo privado, quota etc.) — a sessão
    // simplesmente não persiste entre reloads nesse caso.
  }
  api.defaults.headers.common.Authorization = `Bearer ${token}`
}

// Extrai o `jti` do token guardado, só decodificando o payload do JWT
// (sem checar assinatura — é só front, a validação de verdade é sempre
// no backend). Usado pra destacar "este dispositivo" na lista de sessões
// em GET /auth/sessions.
export function getCurrentSessionId(): string | null {
  const token = getToken()
  if (!token) return null

  try {
    const payloadB64Url = token.split('.')[1]
    const payloadB64 = payloadB64Url.replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(payloadB64)) as { jti?: string }
    return payload.jti ?? null
  } catch {
    return null
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // ver comentário em setToken
  }
  delete api.defaults.headers.common.Authorization
}

// Sessão via token Bearer, não cookie — front e API podem estar em
// domínios totalmente diferentes sem nenhum problema de SameSite/CORS
// credentials.
export const api = axios.create({ baseURL: API_URL })

// Se já tinha um token salvo de uma sessão anterior, aplica de cara.
const existingToken = getToken()
if (existingToken) {
  api.defaults.headers.common.Authorization = `Bearer ${existingToken}`
}
