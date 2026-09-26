import type { ReactNode } from 'react'

/** Rótulo pequeno em mono/maiúsculas/laranja que abre as seções ("SEGURANÇA", "COMECE AGORA"…). */
export function Eyebrow({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return <span className={`ui-eyebrow${muted ? ' ui-eyebrow--muted' : ''}`}>{children}</span>
}
