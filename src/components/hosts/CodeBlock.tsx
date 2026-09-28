import { useMemo, type ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { highlight, LANG_LABEL, resolveLang } from '../../lib/highlight'
import { CopyButton } from './CopyButton'
import './CodeBlock.css'

/**
 * Bloco de código com cores (highlight.js) e botão "Copiar".
 * - `lang`: 'routeros' | 'powershell' | 'bash' | 'ini' | 'json' (e apelidos, ver lib/highlight.ts).
 * - `copyable={false}` quando o texto tem o token mascarado: no lugar do botão
 *   aparece um aviso, pra ninguém colar um token com "••••" no roteador.
 */
export function CodeBlock({
  code,
  title,
  lang,
  copyable = true,
  children,
}: {
  code: string
  title?: string
  lang?: string
  copyable?: boolean
  children?: ReactNode
}) {
  const language = resolveLang(lang)
  const html = useMemo(() => (language ? highlight(code, language) : null), [code, language])
  const badge = language ? LANG_LABEL[language] : null

  return (
    <div className="code-block">
      <div className="code-block-head">
        <span className="code-block-title">
          {badge && <span className="code-block-lang">{badge}</span>}
          {title && <span className="code-block-name">{title}</span>}
        </span>
        {copyable ? (
          <CopyButton text={code} label="Copiar código" showLabel />
        ) : (
          <span className="code-block-locked" title="Gere um token novo para copiar o comando completo">
            <Lock size={12} /> Token oculto
          </span>
        )}
      </div>
      <pre>
        {html !== null ? (
          <code className={`hljs language-${language}`} dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <code>{code}</code>
        )}
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
