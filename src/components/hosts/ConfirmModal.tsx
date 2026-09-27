import { useEffect, useId, useState, type ReactNode } from 'react'
import { Button } from '../../ui'

/**
 * Modal de confirmação. Com `confirmText`, a pessoa precisa digitar o texto
 * (o endereço do host) pra liberar o botão — usado na exclusão.
 */
export function ConfirmModal({
  title,
  children,
  confirmLabel,
  confirmText,
  danger = true,
  busy = false,
  error,
  onConfirm,
  onCancel,
}: {
  title: string
  children: ReactNode
  confirmLabel: string
  confirmText?: string
  danger?: boolean
  busy?: boolean
  error?: string | null
  onConfirm: () => void
  onCancel: () => void
}) {
  const [typed, setTyped] = useState('')
  const inputId = useId()
  const ready = !confirmText || typed.trim().toLowerCase() === confirmText.toLowerCase()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onCancel])

  return (
    <div className="host-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onCancel()}>
      <div className="host-modal" role="dialog" aria-modal="true" aria-label={title}>
        <h2>{title}</h2>
        <div className="host-modal-body">{children}</div>

        {confirmText && (
          <div className="host-field">
            <label htmlFor={inputId}>
              Digite <code>{confirmText}</code> para confirmar
            </label>
            <input
              id={inputId}
              className="host-input"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              autoFocus
            />
          </div>
        )}

        {error && <p className="host-error">{error}</p>}

        <div className="host-modal-actions">
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            Cancelar
          </Button>
          <Button
            variant={danger ? 'dark' : 'primary'}
            className={danger ? 'host-btn-danger' : ''}
            onClick={onConfirm}
            disabled={!ready || busy}
          >
            {busy ? 'Aguarde…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
