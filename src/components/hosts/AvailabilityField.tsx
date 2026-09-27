import { CheckCircle2, CircleAlert, Loader2 } from 'lucide-react'
import type { AvailabilityState } from '../../lib/useAvailability'
import { formatDate } from '../../lib/time'

/** Mensagem de estado abaixo do campo de subdomínio. */
export function AvailabilityHint({ status, fqdn }: { status: AvailabilityState; fqdn: string }) {
  switch (status.state) {
    case 'idle':
      return <p className="host-hint">De 3 a 63 caracteres: letras, números e hífen.</p>
    case 'checking':
      return (
        <p className="host-hint">
          <Loader2 size={14} className="host-spin" /> Verificando…
        </p>
      )
    case 'available':
      return (
        <p className="host-hint host-hint--ok">
          <CheckCircle2 size={14} /> <code>{fqdn}</code> está disponível.
        </p>
      )
    case 'taken':
      return (
        <p className="host-hint host-hint--error">
          <CircleAlert size={14} /> Esse endereço já está em uso.
        </p>
      )
    case 'reserved':
      return (
        <p className="host-hint host-hint--error">
          <CircleAlert size={14} /> Esse nome é reservado.
        </p>
      )
    case 'quarantine':
      return (
        <p className="host-hint host-hint--error">
          <CircleAlert size={14} /> Este endereço foi liberado recentemente e fica disponível em{' '}
          {formatDate(status.availableAt)}.
        </p>
      )
    case 'invalid':
      return (
        <p className="host-hint host-hint--error">
          <CircleAlert size={14} /> Use de 3 a 63 caracteres: letras minúsculas, números e hífen (sem hífen no começo ou no fim).
        </p>
      )
    case 'error':
      return (
        <p className="host-hint host-hint--error">
          <CircleAlert size={14} /> Não foi possível verificar agora. Tente de novo.
        </p>
      )
  }
}
