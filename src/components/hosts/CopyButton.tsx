import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'

async function writeClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback pra contextos sem Clipboard API (http, iframes).
    const el = document.createElement('textarea')
    el.value = text
    el.setAttribute('readonly', '')
    el.style.position = 'fixed'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(el)
    return ok
  }
}

/**
 * Botão que copia `text` e mostra um check por ~1,5 s. Só ícone por padrão;
 * com `showLabel`, mostra também "Copiar" / "Copiado" (usado nos docs).
 */
export function CopyButton({
  text,
  label = 'Copiar',
  className = '',
  showLabel = false,
}: {
  text: string
  label?: string
  className?: string
  showLabel?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  async function handleCopy() {
    if (!(await writeClipboard(text))) return
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      type="button"
      className={`host-copy ${showLabel ? 'host-copy--labeled' : ''} ${copied ? 'is-copied' : ''} ${className}`}
      onClick={() => void handleCopy()}
      aria-label={copied ? 'Copiado' : label}
      title={copied ? 'Copiado!' : label}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {showLabel && <span>{copied ? 'Copiado' : 'Copiar'}</span>}
    </button>
  )
}
