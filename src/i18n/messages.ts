// Textos da interface. Por enquanto só pt-BR; pra adicionar outro idioma,
// crie um objeto com a mesma forma (tipado por `Messages`) e registre em
// `locales`.
export const ptBR = {
  status: {
    label: 'Status do serviço',
    loading: 'Verificando status…',
    operational: 'Todos os sistemas operacionais',
    degraded: 'Desempenho degradado',
    downtime: 'Serviço indisponível',
    maintenance: 'Em manutenção',
    fallback: 'Status indisponível',
  },
}

export type Messages = typeof ptBR
export type Locale = 'pt-BR'

export const locales: Record<Locale, Messages> = {
  'pt-BR': ptBR,
}

export const DEFAULT_LOCALE: Locale = 'pt-BR'
