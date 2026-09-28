import type { ReactNode } from 'react'
import { CopyButton } from './CopyButton'

/**
 * Bloco de código com botão de copiar. `copyable={false}` quando o texto tem o
 * token mascarado. `labeledCopy` mostra "Copiar" escrito ao lado do ícone.
 */
export function CodeBlock({
  code,
  title,
  copyable = true,
  labeledCopy = false,
  children,
}: {
  code: string
  title?: string
  copyable?: boolean
  labeledCopy?: boolean
  children?: ReactNode
}) {
  return (
    <div className="host-code">
      {(title || copyable) && (
        <div className="host-code-head">
          <span>{title}</span>
          {copyable && <CopyButton text={code} label="Copiar comando" showLabel={labeledCopy} />}
        </div>
      )}
      <pre>
        <code>{code}</code>
      </pre>
      {children}
    </div>
  )
}

/** Linha "campo → valor" (pfSense, UniFi…) com botão de copiar. */
export function FieldRow({ label, value, copyable = true }: { label: string; value: string; copyable?: boolean }) {
  return (
    <div className="host-field-row">
      <span className="host-field-label">{label}</span>
      <code>{value}</code>
      {copyable ? <CopyButton text={value} label={`Copiar ${label}`} /> : <span />}
    </div>
  )
}
