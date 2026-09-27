import { useEffect, useState } from 'react'

const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })

/** "há 3 minutos", "há 2 horas"… `now` vem de `useNow()` (não chame Date.now() no render). */
export function relativeTime(iso: string | null, now: number): string {
  if (!iso) return '—'
  const diff = new Date(iso).getTime() - now
  const abs = Math.abs(diff)

  if (abs < 45_000) return 'agora mesmo'
  if (abs < 3_600_000) return rtf.format(Math.round(diff / 60_000), 'minute')
  if (abs < 86_400_000) return rtf.format(Math.round(diff / 3_600_000), 'hour')
  return rtf.format(Math.round(diff / 86_400_000), 'day')
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

/** Relógio que se atualiza sozinho (padrão: a cada 30 s) pros textos relativos. */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}
