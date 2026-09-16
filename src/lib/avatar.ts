// Fallback de avatar: se o usuário não tiver avatar_url (provider não
// mandou foto, ou ainda vai mandar), gera um avatar padrão com iniciais
// via ui-avatars.com em vez de deixar sem imagem.
const UI_AVATARS_BASE = 'https://ui-avatars.com/api/'

export function getAvatarUrl(user: { avatar_url: string | null; name: string | null; username: string | null }): string {
  if (user.avatar_url) return user.avatar_url

  const label = user.name ?? user.username ?? '?'
  const params = new URLSearchParams({
    name: label,
    background: 'random',
    color: 'fff',
    bold: 'true',
  })

  return `${UI_AVATARS_BASE}?${params.toString()}`
}
