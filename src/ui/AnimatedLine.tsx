import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

/**
 * Linha divisória que "desenha" da esquerda pra direita quando entra na tela.
 *
 * - `dashed`: linha sólida ("_______") ou tracejada ("- - - - -").
 * - `edge`: até onde a linha se estende — `"box"` fica dentro do container de
 *   1126px (mesma largura do conteúdo); `"page"` estoura até a borda real da
 *   janela, de ponta a ponta.
 *
 * A visibilidade é rastreada num wrapper que fica na posição normal do fluxo
 * (`ui-line-wrap`), nunca no elemento que "estoura" a largura da tela: com
 * `edge="page"` o elemento fica numa posição X negativa e, se o
 * IntersectionObserver observasse ele direto, a animação nunca dispararia.
 */
export function AnimatedLine({ dashed = false, edge = 'box' }: { dashed?: boolean; edge?: 'box' | 'page' }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const inView = useInView(wrapRef, { once: true, amount: 0 })

  const classes = ['ui-line']
  if (dashed) classes.push('ui-line--dashed')
  if (edge === 'page') classes.push('ui-line--page')

  return (
    <div ref={wrapRef} className="ui-line-wrap">
      <motion.div
        className={classes.join(' ')}
        initial={{ clipPath: 'inset(0 100% 0 0)' }}
        animate={inView ? { clipPath: 'inset(0 0% 0 0)' } : undefined}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      />
    </div>
  )
}
