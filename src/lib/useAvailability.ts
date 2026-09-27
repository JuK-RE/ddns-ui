import { useEffect, useState } from 'react'
import { checkAvailability } from './hosts'
import { NAME_RE } from './slug'

export type AvailabilityState =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'available' }
  | { state: 'invalid' | 'reserved' | 'taken' | 'error'; message?: string }
  | { state: 'quarantine'; availableAt: string }

type Result = { key: string; value: AvailabilityState }

const DEBOUNCE_MS = 400

/**
 * Checa se `name` está livre na zona, com debounce de 400 ms. O estado é
 * derivado (não há setState síncrono no efeito): enquanto o resultado guardado
 * não é o da chave atual, o campo aparece como "verificando".
 */
export function useAvailability(name: string, zone: string): AvailabilityState {
  const [result, setResult] = useState<Result | null>(null)
  const key = `${zone}|${name}`
  const locallyInvalid = name.length > 0 && !NAME_RE.test(name)

  useEffect(() => {
    if (!name || !zone || locallyInvalid) return

    let cancelled = false
    const timer = setTimeout(() => {
      checkAvailability(name, zone)
        .then((res) => {
          if (cancelled) return
          let value: AvailabilityState
          if (res.available) value = { state: 'available' }
          else if (res.reason === 'quarantine') value = { state: 'quarantine', availableAt: res.available_at }
          else value = { state: res.reason, message: res.message }
          setResult({ key, value })
        })
        .catch(() => {
          if (!cancelled) setResult({ key, value: { state: 'error' } })
        })
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [name, zone, key, locallyInvalid])

  if (!name) return { state: 'idle' }
  if (locallyInvalid) return { state: 'invalid' }
  if (result?.key === key) return result.value
  return { state: 'checking' }
}
