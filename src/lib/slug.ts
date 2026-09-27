/** Regra do backend: 3 a 63 caracteres, a-z, 0-9 e hífen (sem hífen no começo/fim). */
export const NAME_RE = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$/

function stripAccents(value: string) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/** O que a pessoa digita no campo de subdomínio: minúsculo, sem acento, espaço nem símbolo. */
export function sanitizeName(value: string): string {
  return stripAccents(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 63)
}

/** "Clínica Asa Sul" → "clinica-asa-sul". */
export function slugify(label: string): string {
  return stripAccents(label)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63)
    .replace(/-+$/g, '')
}
