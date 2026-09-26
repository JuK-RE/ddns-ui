/**
 * Dados estruturados (schema.org) em <script type="application/ld+json">.
 * O Google lê JSON-LD injetado por JavaScript normalmente. O "<" é escapado
 * pra nenhum texto conseguir fechar a tag <script> antes da hora.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
