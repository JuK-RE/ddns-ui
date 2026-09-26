/** "[texto](url)" → "texto". Pra usar conteúdo com links em JSON-LD/meta. */
export function stripLinks(text: string) {
  return text.replace(/\[([^\]]+)\]\([^)\s]+\)/g, '$1')
}
