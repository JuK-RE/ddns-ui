// O login sai do SPA (vai pro GitHub/Google e volta), então o `state` do
// React Router se perde no caminho. Guardamos o destino no sessionStorage
// pra, depois do login, devolver o usuário pra página que ele tentou abrir.
const KEY = 'ddns_after_login'

export function rememberRedirectAfterLogin(path: string) {
  try {
    sessionStorage.setItem(KEY, path)
  } catch {
    // sem storage (modo privado etc.) — cai no "/" depois do login
  }
}

export function consumeRedirectAfterLogin(): string | null {
  try {
    const path = sessionStorage.getItem(KEY)
    sessionStorage.removeItem(KEY)
    // Só aceita caminho interno — nunca uma URL absoluta vinda do storage.
    return path && path.startsWith('/') && !path.startsWith('//') ? path : null
  } catch {
    return null
  }
}
