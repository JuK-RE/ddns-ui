import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Eyebrow, RichText, SUPPORT_URL } from '../../ui'
import { faqs } from '../../content/faqs'
import { JsonLd } from '../../seo/JsonLd'
import { stripLinks } from '../../seo/text'

/** Perguntas frequentes em acordeão (uma aberta por vez). */
export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <motion.section
      className="landing-faq"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: { '@type': 'Answer', text: stripLinks(item.a) },
          })),
        }}
      />

      <div className="landing-faq-intro">
        <Eyebrow>Perguntas frequentes</Eyebrow>
        <h2>Ficou alguma dúvida?</h2>
        <p>
          Separamos as perguntas mais comuns. Se a sua não estiver aqui,{' '}
          <a className="landing-inline-link" href={SUPPORT_URL} target="_blank" rel="noreferrer">
            fala com a gente
          </a>
          .
        </p>
      </div>

      <ul className="landing-faq-list">
        {faqs.map((item, i) => {
          const isOpen = open === i
          const panelId = `faq-panel-${i}`
          return (
            <li key={item.q} className={isOpen ? 'is-open' : undefined}>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
              >
                <span>{item.q}</span>
                <Plus size={16} className="landing-faq-icon" />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    id={panelId}
                    className="landing-faq-answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  >
                    <p>
                      <RichText text={item.a} />
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          )
        })}
      </ul>
    </motion.section>
  )
}
