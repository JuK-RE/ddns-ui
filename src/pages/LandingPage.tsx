import { useEffect, useState, type ReactNode } from 'react'
import { motion, AnimatePresence, useMotionValue, animate as animateValue } from 'framer-motion'
import {
  Router,
  Terminal,
  RefreshCw,
  FileCode2,
  Globe,
  Search,
  Zap,
  Save,
  CheckCircle2,
  XCircle,
  Circle,
  Loader2,
} from 'lucide-react'
import { SiGithub, SiMikrotik, SiUbiquiti, SiPfsense, SiTplink, SiUbuntu } from 'react-icons/si'
import { FaWindows } from 'react-icons/fa'
import { useAuth } from '../auth/AuthContext'
import { AnimatedLine, BrandLockup, ButtonLink, Eyebrow, REPO_URL, SiteFooter, SiteNav } from '../ui'
import { FaqSection } from './landing/FaqSection'
import { usePageMeta } from '../seo/usePageMeta'
import './LandingPage.css'

const steps = [
  { n: '01', title: 'Open source', desc: 'Código aberto no GitHub', icon: SiGithub },
  { n: '02', title: 'Multi-provedor', desc: 'MikroTik, UniFi e outros', icon: Router },
  { n: '03', title: 'Cliente simples', desc: 'Via HTTP ou CLI', icon: Terminal },
  { n: '04', title: 'IP sempre atual', desc: 'Domínio sempre no IP certo', icon: RefreshCw },
  { n: '05', title: 'API documentada', desc: 'Simples e bem documentada', icon: FileCode2 },
]

// Quanto tempo cada passo fica em destaque antes de trocar pro próximo — usada
// tanto pro setInterval quanto pra duração da barrinha de "carregando" no
// indicador mobile, então as duas coisas ficam sempre no mesmo compasso (se
// mudar uma, muda a outra).
const STEP_INTERVAL_MS = 3500

type CompatItem = {
  label: string
  badge?: typeof SiMikrotik
  plus?: string
  /** Cor oficial da marca. Sem cor, usa a tinta escura do site. */
  color?: string
}

// Logos soltas (sem o quadradinho) na cor oficial de cada marca.
const compatList: CompatItem[] = [
  { badge: SiMikrotik, label: 'MikroTik', color: '#293239' },
  { badge: SiUbiquiti, label: 'UniFi', color: '#0559C9' },
  { badge: SiPfsense, label: 'pfSense', color: '#212121' },
  { badge: SiTplink, label: 'TP-Link', color: '#4ACBD6' },
  { badge: FaWindows, label: 'Windows Server', color: '#0078D4' },
  { badge: SiUbuntu, label: 'Ubuntu', color: '#E95420' },
  { badge: Globe, label: 'APIs (HTTP puro)' },
  { plus: '+5', label: 'Outras integrações' },
]

const compatLinks = [
  { label: 'MikroTik', href: 'https://mikrotik.com/' },
  { label: 'UniFi', href: 'https://www.ui.com/' },
  { label: 'pfSense', href: 'https://www.pfsense.org/' },
  { label: 'TP-Link', href: 'https://www.tp-link.com/' },
  { label: 'Windows Server', href: 'https://www.microsoft.com/en-us/windows-server' },
  { label: 'Ubuntu', href: 'https://ubuntu.com/' },
]

// `final` é o ícone que a linha mostra depois de processada: 'ok' termina em
// check, 'none' termina em X (caso da linha que não achou mudança nenhuma).
const contextRows = [
  { label: 'Verificando IP', icon: Search, final: 'ok' as const },
  { label: 'Mudança identificada', icon: Zap, final: 'ok' as const },
  { label: 'Atualizando o IP', icon: RefreshCw, final: 'ok' as const },
  { label: 'Salvando no histórico', icon: Save, final: 'ok' as const },
  { label: 'Verificando IP', icon: Search, final: 'ok' as const },
  { label: 'Mudança não identificada', icon: XCircle, final: 'none' as const },
]

// Duração de uma volta do spinner de carregando (mesmo valor do
// @keyframes landing-status-spin no LandingPage.css — se mudar um, muda o
// outro). É a "unidade" de tempo pra todo o resto do log ficar no mesmo
// compasso.
const SPIN_DURATION_MS = 900
// Cada linha fica em foco por exatamente 4 voltas inteiras do spinner.
const ROW_DWELL_MS = SPIN_DURATION_MS * 4

// Altura de cada linha (20px) + gap (9px) — usada pra calcular a distância
// que a faixa precisa rolar.
const ROW_STEP = 29
// +1 no total: depois da última linha processar, a faixa "descansa" com tudo
// concluído por uma volta inteira antes de reiniciar o ciclo — sem essa
// folga, a última linha nunca chegava a mostrar o resultado.
const CONTEXT_LOOP_DISTANCE = ROW_STEP * (contextRows.length + 1)
// Duração total = tempo de cada linha × quantidade de "posições" (linhas +
// o descanso final) — a velocidade da rolagem é consequência do tempo por
// linha, nunca o contrário.
const CONTEXT_LOOP_DURATION = (ROW_DWELL_MS / 1000) * (contextRows.length + 1)

// Empurra o conteúdo pra baixo dentro da janelinha (2 linhas de respiro), pra
// que o check/X apareça enquanto a linha ainda está no meio da área visível
// — sem isso o resultado só surgia depois que a linha já tinha saído por cima.
const CONTEXT_VISUAL_BUFFER = ROW_STEP * 2

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

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
})

export function LandingPage() {
  const [activeStep, setActiveStep] = useState(0)
  // Logado: o painel mora no "/" (a LP fica em /home). Visitante: vai pro login.
  const { user } = useAuth()
  const panelHref = user ? '/' : '/auth'
  const panelLabel = user ? 'Ir para o painel' : 'Acessar painel'
  // "/" e "/home" mostram a mesma landing: a canônica é sempre "/".
  usePageMeta({ path: '/' })

  useEffect(() => {
    const id = setInterval(() => {
      setActiveStep((i) => (i + 1) % steps.length)
    }, STEP_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  // Log da seção "COMO FUNCIONA": faixinha com rolagem contínua, mantendo os
  // 3 estágios (pendente/carregando/concluído) sem mostrar resultado antes da
  // hora. A posição é um motionValue; cada atualização calcula `logPos` — até
  // qual linha já foi processada nesse ciclo. A faixa mostra 2 cópias da
  // lista: a primeira usa `logPos`; a segunda (a "próxima volta", espiando lá
  // embaixo) fica sempre pendente.
  const contextScrollY = useMotionValue(0)
  const [logPos, setLogPos] = useState(0)

  useEffect(() => {
    const controls = animateValue(contextScrollY, [0, -CONTEXT_LOOP_DISTANCE], {
      duration: CONTEXT_LOOP_DURATION,
      repeat: Infinity,
      ease: 'linear',
    })
    return controls.stop
  }, [contextScrollY])

  useEffect(() => {
    return contextScrollY.on('change', (latest) => {
      const raw = Math.floor((-latest + ROW_STEP) / ROW_STEP)
      const pos = Math.min(Math.max(raw - 1, 0), contextRows.length)
      setLogPos((current) => (current === pos ? current : pos))
    })
  }, [contextScrollY])

  return (
    <div className="landing">
      <SiteNav>
        <ButtonLink variant="ghost" size="sm" href={REPO_URL} external className="landing-nav-github">
          <SiGithub size={14} />
          GitHub
        </ButtonLink>
        <ButtonLink to={panelHref} size="sm">
          {panelLabel}
        </ButtonLink>
      </SiteNav>

      <AnimatedLine dashed edge="page" />

      <header className="landing-hero">
        <motion.div {...fadeUp(0)} className="landing-hero-lockup">
          <BrandLockup />
        </motion.div>
        <motion.h1 {...fadeUp(0.06)}>
          Seu próprio DDNS,
          <br />
          sob seu controle.
        </motion.h1>
        <motion.p className="landing-lede" {...fadeUp(0.14)}>
          Um Dynamic DNS moderno, transparente e open source para manter sua rede sempre acessível.
        </motion.p>
        <motion.div className="landing-hero-actions" {...fadeUp(0.22)}>
          <ButtonLink to={panelHref} size="lg">
            {panelLabel}
          </ButtonLink>
          <ButtonLink variant="outline" size="lg" href={REPO_URL} external>
            <SiGithub size={15} />
            Ver no GitHub
          </ButtonLink>
        </motion.div>
      </header>

      <AnimatedLine dashed edge="page" />

      <section className="landing-tabs">
        {steps.map((step, i) => {
          const Icon = step.icon
          const isActive = i === activeStep
          return (
            <div className={`landing-tab${isActive ? ' is-active' : ''}`} key={step.n}>
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

      {/* Versão mobile dos 5 passos: mesmo cartão do desktop mostrando só o
          passo ativo, com fade na troca e uma barrinha que enche até o
          próximo. Sem carrossel, sem scroll. */}
      <section className="landing-steps-mobile">
        <div className="landing-steps-card">
          <AnimatePresence mode="wait">
            {(() => {
              const step = steps[activeStep]
              const Icon = step.icon
              return (
                <motion.div
                  key={step.n}
                  className="landing-steps-active"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  <span className="landing-eyebrow-num">
                    <Icon size={13} />
                    {step.n}
                  </span>
                  <strong>{step.title}</strong>
                  <span className="landing-steps-desc">{step.desc}</span>
                </motion.div>
              )
            })()}
          </AnimatePresence>
          {/* Barra fora do AnimatePresence de propósito: precisa reiniciar
              exatamente quando activeStep muda, sem esperar o fade. */}
          <span className="landing-steps-active-bar-track">
            <motion.span
              key={activeStep}
              className="landing-steps-active-bar-fill"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: STEP_INTERVAL_MS / 1000, ease: 'linear' }}
            />
          </span>
        </div>
      </section>

      <AnimatedLine edge="box" />

      <Reveal className="landing-split">
        <div className="landing-split-text">
          <Eyebrow>Compatibilidade</Eyebrow>
          <h2>Conecte do seu jeito. Funciona onde você precisa.</h2>
          <p>
            Configure direto no roteador, use nossa API HTTP ou o client oficial: compatível com{' '}
            {compatLinks.map((link, i) => (
              <span key={link.label}>
                <a className="landing-inline-link" href={link.href} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
                {i < compatLinks.length - 1 ? ', ' : ''}
              </span>
            ))}{' '}
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
        <div className="landing-grid">
          {compatList.map((item) => {
            const Badge = item.badge
            return (
              <div className="landing-grid-cell" key={item.label}>
                <span className="landing-grid-logo" style={item.color ? { color: item.color } : undefined}>
                  {Badge ? <Badge size={30} /> : <span className="landing-grid-plus">{item.plus}</span>}
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
          <motion.div className="landing-context-track" style={{ y: contextScrollY, paddingTop: CONTEXT_VISUAL_BUFFER }}>
            {[0, 1].flatMap((copy) =>
              contextRows.map((row, i) => {
                const Icon = row.icon
                const FinalIcon = row.final === 'none' ? XCircle : CheckCircle2
                // Cópia 0 é a volta atual (usa logPos); cópia 1 é a próxima
                // volta espiando lá embaixo — sempre pendente.
                const stage = copy === 1 ? 'pending' : i < logPos ? 'done' : i === logPos ? 'loading' : 'pending'
                return (
                  <div className={`landing-context-row landing-context-row--${stage}`} key={`${copy}-${row.label}-${i}`}>
                    <Icon size={14} />
                    <span>{row.label}</span>
                    <span className="landing-context-status">
                      {stage === 'pending' && <Circle key="pending" size={12} className="landing-context-status-icon" />}
                      {stage === 'loading' && (
                        <Loader2 key="loading" size={12} className="landing-context-status-icon landing-context-status-icon--spin" />
                      )}
                      {stage === 'done' && <FinalIcon key="done" size={12} className="landing-context-status-icon" />}
                    </span>
                  </div>
                )
              }),
            )}
          </motion.div>
        </div>
        <Eyebrow>Como funciona</Eyebrow>
        <h2>Seu IP mudou? Seu domínio acompanha.</h2>
        <p>
          De tempos em tempos, o nosso app ou o seu roteador confere qual é o seu IP. Se ele mudou, o seu domínio é
          atualizado na hora.
        </p>
      </Reveal>

      <AnimatedLine edge="box" />

      <FaqSection />

      <AnimatedLine edge="box" />

      <Reveal className="landing-cta">
        <Eyebrow>Comece agora</Eyebrow>
        <h2>Configure seu próprio DDNS em minutos.</h2>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <ButtonLink to={panelHref} size="lg">
            {panelLabel}
          </ButtonLink>
        </motion.div>
      </Reveal>

      <AnimatedLine edge="box" />

      <SiteFooter />
    </div>
  )
}
