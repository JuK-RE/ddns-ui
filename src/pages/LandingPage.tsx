import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { Router, Terminal, RefreshCw, FileCode2, Lock, ShieldCheck, ScrollText, ChevronRight, ArrowRight, Globe } from 'lucide-react'
import { SiGithub, SiMikrotik, SiUbiquiti, SiPfsense, SiTplink, SiUbuntu } from 'react-icons/si'
import { FaWindows } from 'react-icons/fa'
import { JucasoftWordmark } from '../components/JucasoftWordmark'
import { JukWordmark } from '../components/JukWordmark'
import './LandingPage.css'

const REPO_URL = 'https://github.com/JuK-RE/'

const steps = [
  { n: '01', title: 'Open source', desc: 'Código aberto no GitHub', icon: SiGithub },
  { n: '02', title: 'Multi-provedor', desc: 'MikroTik, UniFi e outros', icon: Router },
  { n: '03', title: 'Cliente simples', desc: 'Via HTTP ou CLI', icon: Terminal },
  { n: '04', title: 'IP sempre atual', desc: 'Domínio sempre no IP certo', icon: RefreshCw },
  { n: '05', title: 'API documentada', desc: 'Simples e bem documentada', icon: FileCode2 },
]

type CompatItem = {
  label: string
  badge?: typeof SiMikrotik
  plus?: string
}

const compatList: CompatItem[] = [
  { badge: SiMikrotik, label: 'MikroTik' },
  { badge: SiUbiquiti, label: 'UniFi' },
  { badge: SiPfsense, label: 'pfSense' },
  { badge: SiTplink, label: 'TP-Link' },
  { badge: FaWindows, label: 'Windows Server' },
  { badge: SiUbuntu, label: 'Ubuntu' },
  { badge: Globe, label: 'APIs (HTTP puro)' },
  { plus: '+5', label: 'Outras integrações' },
]

const securityItems = [
  {
    icon: Lock,
    title: 'Login sem senha',
    desc: 'Todo acesso passa por OAuth (GitHub ou Google). O ddns-api nunca guarda credenciais próprias.',
  },
  {
    icon: ShieldCheck,
    title: 'Sessões revogáveis',
    desc: 'Cada dispositivo aparece na lista de sessões e pode ser desconectado remotamente a qualquer momento.',
  },
  {
    icon: ScrollText,
    title: 'Histórico auditável',
    desc: 'Toda versão registrada fica salva com data e descrição, direto no banco D1.',
  },
]

const contextRows = [
  'Verificando IP',
  'Mudança identificada',
  'Atualizando o IP',
  'Salvando no histórico',
  'Verificando IP',
  'Mudança não identificada',
]

// Altura de cada linha (20px) + gap (9px) — mesma proporção da referência,
// usada como distância do loop do carrossel abaixo.
const ROW_STEP = 29
const CONTEXT_LOOP_DISTANCE = ROW_STEP * contextRows.length
// Velocidade fixa (px/s) baseada na proporção original de 3 linhas em 8s —
// assim, se a quantidade de linhas do "log" mudar de novo, a rolagem continua
// no mesmo ritmo em vez de acelerar ou desacelerar.
const CONTEXT_ROW_SPEED = (ROW_STEP * 3) / 8
const CONTEXT_LOOP_DURATION = CONTEXT_LOOP_DISTANCE / CONTEXT_ROW_SPEED

/**
 * Linha divisória que "desenha" da esquerda pra direita quando entra na tela.
 *
 * - `dashed`: linha sólida ("_______") ou tracejada ("- - - - -").
 * - `edge`: até onde a linha se estende — `"box"` fica dentro do container de
 *   1126px (mesma largura do conteúdo); `"page"` estoura até a borda real da
 *   janela, de ponta a ponta.
 *
 * A visibilidade é rastreada num wrapper que fica na posição normal do fluxo
 * do documento (`landing-line-wrap`), nunca no elemento que efetivamente
 * "estoura" a largura da tela. Isso importa porque `edge="page"` desloca o
 * elemento pra uma posição X negativa (ver .landing-line--page) — se o
 * IntersectionObserver observasse esse elemento diretamente, o ponto de
 * referência do clip-path ficaria sempre fora da viewport e a animação nunca
 * dispararia, em nenhuma posição de scroll.
 */
function AnimatedLine({ dashed = false, edge = 'box' }: { dashed?: boolean; edge?: 'box' | 'page' }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const inView = useInView(wrapRef, { once: true, amount: 0 })

  const classes = ['landing-line']
  if (dashed) classes.push('landing-line--dashed')
  if (edge === 'page') classes.push('landing-line--page')

  return (
    <div ref={wrapRef} className="landing-line-wrap">
      <motion.div
        className={classes.join(' ')}
        initial={{ clipPath: 'inset(0 100% 0 0)' }}
        animate={inView ? { clipPath: 'inset(0 0% 0 0)' } : undefined}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      />
    </div>
  )
}

function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.section
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {children}
    </motion.section>
  )
}

export function LandingPage() {
  const [activeStep, setActiveStep] = useState(0)
  const tabRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const id = setInterval(() => {
      setActiveStep((i) => (i + 1) % steps.length)
    }, 3500)
    return () => clearInterval(id)
  }, [])

  // Em telas estreitas, a seção de passos vira uma faixa com scroll horizontal
  // (ver .landing-tabs no CSS) — aqui a rolagem acompanha o passo ativo, pra
  // quem não arrastar manualmente também ver os outros passos passando.
  //
  // Importante: mexemos SÓ no scrollLeft do próprio container, nunca com
  // scrollIntoView. O scrollIntoView, mesmo com block:"nearest", ainda rola a
  // página verticalmente pra trazer o elemento de volta à tela sempre que ele
  // está fora da viewport — e como esse efeito roda a cada 3.5s (a cada troca
  // de passo) independente de onde a pessoa esteja rolando a página, isso
  // puxava a página de volta pra essa seção mesmo com o usuário lá embaixo no
  // rodapé. Ajustando só o scrollLeft do carrossel, o scroll vertical da
  // página nunca é tocado.
  useEffect(() => {
    const tab = tabRefs.current[activeStep]
    const container = tab?.parentElement as HTMLElement | null | undefined
    if (tab && container && container.scrollWidth > container.clientWidth) {
      const targetLeft = tab.offsetLeft - (container.clientWidth - tab.offsetWidth) / 2
      container.scrollTo({ left: targetLeft, behavior: 'smooth' })
    }
  }, [activeStep])

  return (
    <div className="landing">
      <nav className="landing-nav">
        <JucasoftWordmark className="landing-brand-logo" height={22} />
        <Link to="/auth" className="landing-pill">
          Acessar painel
        </Link>
      </nav>

      <AnimatedLine dashed edge="page" />

      <header className="landing-hero">
        <motion.div
          className="landing-hero-badge"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <JukWordmark height={13} />
          <span className="landing-hero-badge-divider" aria-hidden="true" />
          <span>DDNS</span>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.06 }}>
          Seu próprio DDNS,
          <br />
          sob seu controle.
        </motion.h1>
        <motion.p
          className="landing-lede"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.14 }}
        >
          Um Dynamic DNS moderno, transparente e open source para manter sua rede sempre acessível.
        </motion.p>
        <motion.a
          className="landing-outline-button"
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.22 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <SiGithub size={15} />
          Ver no GitHub
        </motion.a>
      </header>

      <AnimatedLine dashed edge="page" />

      <section className="landing-tabs">
        {steps.map((step, i) => {
          const Icon = step.icon
          const isActive = i === activeStep
          return (
            <div
              className={`landing-tab${isActive ? ' is-active' : ''}`}
              key={step.n}
              ref={(el) => {
                tabRefs.current[i] = el
              }}
            >
              <span className="landing-eyebrow-num">
                <Icon size={13} />
                {step.n}
              </span>
              <strong>{step.title}</strong>
              <span className="landing-tab-desc">{step.desc}</span>
              {isActive && (
                <motion.div
                  className="landing-tab-underline"
                  layoutId="landing-tab-underline"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </div>
          )
        })}
      </section>

      <AnimatedLine edge="box" />

      <Reveal className="landing-split">
        <div className="landing-split-text">
          <span className="landing-eyebrow">COMPATIBILIDADE</span>
          <h2>Conecte do seu jeito. Funciona onde você precisa.</h2>
          <p>
            Configure direto no roteador, use nossa API HTTP ou o client oficial: compatível com{' '}
            <a className="landing-inline-link" href="https://mikrotik.com/" target="_blank" rel="noreferrer">
              MikroTik
            </a>
            ,{' '}
            <a className="landing-inline-link" href="https://www.ui.com/" target="_blank" rel="noreferrer">
              UniFi
            </a>
            ,{' '}
            <a className="landing-inline-link" href="https://www.pfsense.org/" target="_blank" rel="noreferrer">
              pfSense
            </a>
            ,{' '}
            <a className="landing-inline-link" href="https://www.tp-link.com/" target="_blank" rel="noreferrer">
              TP-Link
            </a>
            ,{' '}
            <a
              className="landing-inline-link"
              href="https://www.microsoft.com/en-us/windows-server"
              target="_blank"
              rel="noreferrer"
            >
              Windows Server
            </a>
            ,{' '}
            <a className="landing-inline-link" href="https://ubuntu.com/" target="_blank" rel="noreferrer">
              Ubuntu
            </a>{' '}
            e muito mais.
          </p>
          <p>
            Tudo roda sobre a infraestrutura da{' '}
            <a className="landing-inline-link" href="https://www.cloudflare.com/" target="_blank" rel="noreferrer">
              Cloudflare
            </a>
            , com uma base rápida e confiável. E por ser{' '}
            <a className="landing-inline-link" href={REPO_URL} target="_blank" rel="noreferrer">
              open source
            </a>
            , você pode auditar o código, adaptar ou rodar sua própria instância.
          </p>
          <a className="landing-text-link" href={REPO_URL} target="_blank" rel="noreferrer">
            <SiGithub size={14} />
            Ver código-fonte no GitHub
          </a>
        </div>
        <div className="landing-grid landing-grid--compat">
          {compatList.map((item) => {
            const Badge = item.badge
            return (
              <div className="landing-grid-cell" key={item.label}>
                <span className="landing-grid-badge">
                  {Badge ? <Badge size={18} /> : <span className="landing-grid-plus">{item.plus}</span>}
                </span>
                <span>{item.label}</span>
              </div>
            )
          })}
        </div>
      </Reveal>

      <AnimatedLine edge="box" />

      <Reveal className="landing-context">
        <div className="landing-context-reads" aria-hidden="true">
          <motion.div
            className="landing-context-track"
            animate={{ y: [0, -CONTEXT_LOOP_DISTANCE] }}
            transition={{ duration: CONTEXT_LOOP_DURATION, repeat: Infinity, ease: 'linear' }}
          >
            {[...contextRows, ...contextRows].map((row, i) => (
              <div className="landing-context-row" key={`${row}-${i}`}>
                <Terminal size={14} />
                <span>{row}</span>
                <ChevronRight size={14} className="landing-context-chevron" />
              </div>
            ))}
          </motion.div>
        </div>
        <span className="landing-eyebrow">COMO FUNCIONA</span>
        <h2>Cada atualização de IP, registrada.</h2>
        <p>
          Toda chamada autenticada gera uma sessão rastreável, e cada nova versão do sistema fica registrada com
          descrição — dá pra saber exatamente o que mudou e quando.
        </p>
      </Reveal>

      <AnimatedLine edge="box" />

      <Reveal className="landing-security">
        <div className="landing-security-text">
          <span className="landing-eyebrow">SEGURANÇA</span>
          <h2>
            Sessões isoladas.
            <br />
            Tokens revogáveis.
          </h2>
          <p>
            Cada login gera um token JWT vinculado a uma sessão própria. Nenhuma senha é armazenada — a
            autenticação é sempre delegada ao GitHub ou Google.
          </p>
          <p>Chaves de API e segredos ficam nas variáveis de ambiente da Cloudflare Worker, nunca no repositório.</p>
        </div>
        <ol className="landing-security-list">
          {securityItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.title}>
                <span className="landing-security-icon">
                  <Icon size={17} />
                </span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </li>
            )
          })}
        </ol>
      </Reveal>

      <AnimatedLine edge="box" />

      <Reveal className="landing-cta">
        <span className="landing-eyebrow">COMECE AGORA</span>
        <h2>Configure seu próprio DDNS em minutos.</h2>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Link to="/auth" className="landing-pill landing-pill--large">
            Acessar painel
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </Reveal>

      <AnimatedLine edge="box" />

      <footer className="landing-footer">
        <span>© 2026 JUK.re DDNS</span>
        <a href={REPO_URL} target="_blank" rel="noreferrer">
          <SiGithub size={14} />
          GitHub
        </a>
      </footer>
    </div>
  )
}
