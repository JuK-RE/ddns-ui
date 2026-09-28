// Parser de Markdown enxuto (só o que a documentação usa), sem dependências.
// Gera uma lista de blocos que o <Markdown /> renderiza como elementos React
// — nunca HTML cru, então o conteúdo dos .md não injeta nada na página.
//
// Suporta: # títulos (1–3), parágrafos, listas (- e 1.), blocos ``` de código
// (```lang Título opcional → o título aparece no cabeçalho do bloco),
// > citações, tabelas |a|b|, imagens ![alt](src) em linha própria, --- e, no
// texto: `código`, **negrito**, *itálico* e [links](url).

export type Block =
  | { type: 'heading'; level: 1 | 2 | 3; text: string; id: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'code'; lang: string; title: string; code: string }
  | { type: 'quote'; text: string }
  | { type: 'image'; alt: string; src: string }
  | { type: 'table'; head: string[]; rows: string[][] }
  | { type: 'hr' }

export function slugifyHeading(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const splitRow = (line: string) =>
  line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())

const isTableSep = (line: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line)

export function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.trim() === '') {
      i++
      continue
    }

    // bloco de código
    const fence = line.match(/^```([\w-]*)[ \t]*(.*?)\s*$/)
    if (fence) {
      const code: string[] = []
      i++
      while (i < lines.length && !/^```\s*$/.test(lines[i])) code.push(lines[i++])
      i++ // fecha a cerca
      blocks.push({ type: 'code', lang: fence[1], title: fence[2], code: code.join('\n') })
      continue
    }

    const heading = line.match(/^(#{1,3})\s+(.+?)\s*#*\s*$/)
    if (heading) {
      const text = heading[2]
      blocks.push({ type: 'heading', level: heading[1].length as 1 | 2 | 3, text, id: slugifyHeading(text) })
      i++
      continue
    }

    if (/^\s*---+\s*$/.test(line)) {
      blocks.push({ type: 'hr' })
      i++
      continue
    }

    const image = line.match(/^!\[([^\]]*)\]\(([^)\s]+)\)\s*$/)
    if (image) {
      blocks.push({ type: 'image', alt: image[1], src: image[2] })
      i++
      continue
    }

    if (line.trimStart().startsWith('>')) {
      const quote: string[] = []
      while (i < lines.length && lines[i].trimStart().startsWith('>')) quote.push(lines[i++].replace(/^\s*>\s?/, ''))
      blocks.push({ type: 'quote', text: quote.join(' ') })
      continue
    }

    if (line.includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const head = splitRow(line)
      const rows: string[][] = []
      i += 2
      while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') rows.push(splitRow(lines[i++]))
      blocks.push({ type: 'table', head, rows })
      continue
    }

    const listMatch = line.match(/^\s*([-*]|\d+\.)\s+(.*)$/)
    if (listMatch) {
      const ordered = /\d+\./.test(listMatch[1])
      const items: string[] = []
      while (i < lines.length) {
        const m = lines[i].match(/^\s*([-*]|\d+\.)\s+(.*)$/)
        if (m && /\d+\./.test(m[1]) === ordered) {
          items.push(m[2])
          i++
        } else if (lines[i].startsWith('  ') && lines[i].trim() !== '' && items.length > 0) {
          items[items.length - 1] += ` ${lines[i].trim()}` // continuação do item
          i++
        } else break
      }
      blocks.push({ type: 'list', ordered, items })
      continue
    }

    // parágrafo: junta linhas até a próxima linha em branco ou bloco novo
    const para: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(#{1,3}\s|```|\s*---+\s*$|\s*>)/.test(lines[i]) &&
      !/^\s*([-*]|\d+\.)\s+/.test(lines[i]) &&
      !/^!\[[^\]]*\]\([^)\s]+\)\s*$/.test(lines[i])
    ) {
      para.push(lines[i++].trim())
    }
    blocks.push({ type: 'paragraph', text: para.join(' ') })
  }

  return blocks
}

export type TocItem = { id: string; text: string; level: 2 | 3 }

/** Títulos "##" e "###" da página, pro índice "Nesta página". */
export function tocOf(blocks: Block[]): TocItem[] {
  return blocks
    .filter((b): b is Extract<Block, { type: 'heading' }> => b.type === 'heading' && b.level > 1)
    .map((b) => ({ id: b.id, text: b.text.replace(/`/g, ''), level: b.level as 2 | 3 }))
}
