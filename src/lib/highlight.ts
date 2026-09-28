import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import ini from 'highlight.js/lib/languages/ini'
import json from 'highlight.js/lib/languages/json'
import powershell from 'highlight.js/lib/languages/powershell'
import routeros from 'highlight.js/lib/languages/routeros'

// Destaque de sintaxe dos blocos de código (painel e docs). Só registramos
// as linguagens que usamos, pra não carregar as ~190 do highlight.js.
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('ini', ini)
hljs.registerLanguage('json', json)
hljs.registerLanguage('powershell', powershell)
hljs.registerLanguage('routeros', routeros)

const ALIASES: Record<string, string> = {
  sh: 'bash',
  shell: 'bash',
  cron: 'bash',
  ps1: 'powershell',
  ps: 'powershell',
  pwsh: 'powershell',
  mikrotik: 'routeros',
  conf: 'ini',
  toml: 'ini',
}

export const LANG_LABEL: Record<string, string> = {
  bash: 'Bash',
  ini: 'Config',
  json: 'JSON',
  powershell: 'PowerShell',
  routeros: 'RouterOS',
}

export function resolveLang(lang?: string): string | null {
  if (!lang) return null
  const key = lang.toLowerCase()
  const name = ALIASES[key] ?? key
  return hljs.getLanguage(name) ? name : null
}

/**
 * HTML com as classes `hljs-*`. O highlight.js escapa o texto de entrada,
 * então o resultado é seguro pra `dangerouslySetInnerHTML`.
 */
export function highlight(code: string, lang: string): string {
  return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value
}
