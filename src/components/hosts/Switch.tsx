/** Chave liga/desliga acessível (role="switch"). */
export function Switch({
  checked,
  onChange,
  disabled = false,
  label,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      disabled={disabled}
      className={`host-switch ${checked ? 'is-on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="host-switch-thumb" />
    </button>
  )
}
