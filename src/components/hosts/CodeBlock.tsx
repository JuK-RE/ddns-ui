import { useMemo, type ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { highlight, LANG_LABEL, resolveLang } from '../../lib/highlight'
import { CopyButton } from './CopyButton'
import './CodeBlock.css'

/**
 * Bloco de código compacto (estilo Cloudflare): rótulo pequeno em cima e, na
 * caixa, o código com cores (highlight.js) e um botão de copiar do lado.
 * - `lang`: 'routeros' | 'powershell' | 'bash' | 'ini' | 'json' (e apelidos, ver lib/highlight.ts).
 * - `code` é o que aparece (com o token mascarado); `copyText` é o que vai pra
 *   área de transferência (com o token de verdade). Sem `copyText`, copia `code`.
 * - `copyable={false}` quando não há token completo: no lugar do botão aparece
 *   um cadeado, pra ninguém colar um token com "••••" no roteador.
 */
export function CodeBlock({
  code,
  copyText,
  title,
  lang,
  copyable = true,
  children,
}: {
  code: string
  copyText?: string
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
      {(badge || title) && (
        <div className="code-block-title">
          {badge && <span className="code-block-lang">{badge}</span>}
          {title && <span className="code-block-name">{title}</span>}
        </div>
      )}
      <div className="code-block-box">
        <pre>
          {html !== null ? (
            <code className={`hljs language-${language}`} dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <code>{code}</code>
          )}
        </pre>
        <div className="code-block-action">
          {copyable ? (
            <CopyButton text={copyText ?? code} label="Copiar código" />
          ) : (
            <span className="code-block-locked" title="Token indisponível: gere um token novo para copiar o comando completo">
              <Lock size={14} />
            </span>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}

/** Linha "campo → valor" (pfSense, UniFi…) com botão de copiar. */
export function FieldRow({
  label,
  value,
  copyText,
  copyable = true,
}: {
  label: string
  value: string
  /** O que vai pra área de transferência, se for diferente do exibido (token mascarado). */
  copyText?: string
  copyable?: boolean
}) {
  return (
    <div className="host-field-row">
      <span className="host-field-label">{label}</span>
      <code>{value}</code>
      {copyable ? <CopyButton text={copyText ?? value} label={`Copiar ${label}`} /> : <span />}
    </div>
  )
}
