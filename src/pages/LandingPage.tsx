import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useInView, useMotionValue, animate as animateValue } from 'framer-motion'
import {
  Router,
  Terminal,
  RefreshCw,
  FileCode2,
  Lock,
  ShieldCheck,
  ScrollText,
  ArrowRight,
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

// Quanto tempo cada passo fica em destaque antes de trocar pro próximo — usada
// tanto pro setInterval quanto pra duração da barrinha de "carregando" no
// indicador mobile, então as duas coisas ficam sempre no mesmo compasso (se
// mudar uma, muda a outra).
const STEP_INTERVAL_MS = 3500

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
// outro). Usamos ela como "unidade" de tempo pra todo o resto do log ficar no
// mesmo compasso, em vez de números soltos sem relação entre si.
const SPIN_DURATION_MS = 900
// Cada linha fica em foco por exatamente 4 voltas inteiras do spinner — dá
// tempo de ler o texto e ver o spinner girar por completo antes de concluir,
// em vez de cortar a rotação no meio (e, com isso, deixa tudo mais lento).
const ROW_DWELL_MS = SPIN_DURATION_MS * 4

// Altura de cada linha (20px) + gap (9px) — usada só pra calcular a distância
// que a faixa precisa rolar.
const ROW_STEP = 29
// +1 no total: depois da última linha processar, a faixa "descansa" com tudo
// concluído por uma volta inteira antes de reiniciar o ciclo — sem essa
// folga, a última linha nunca chegava a mostrar o resultado, pulava direto
// de carregando pra pendente de novo.
const CONTEXT_LOOP_DISTANCE = ROW_STEP * (contextRows.length + 1)
// Duração total = tempo de cada linha × quantidade de "posições" (linhas +
// o descanso final) — assim a velocidade da rolagem é sempre a consequência
// do tempo por linha, nunca o contrário.
const CONTEXT_LOOP_DURATION = (ROW_DWELL_MS / 1000) * (contextRows.length + 1)

// Empurra o conteúdo pra baixo dentro da janelinha, sem mexer no cálculo de
// `logPos` (isso continua batendo certinho com o tempo). O problema era que,
// pela matemática original, uma linha só virava "concluída" bem na hora em
// que ela já tinha rolado pra fora da janela (por cima) — o resultado
// aparecia depois que já tinha sumido. Com esse respiro de 2 linhas, o
// check/X aparece enquanto a linha ainda está bem no meio da área visível.
const CONTEXT_VISUAL_BUFFER = ROW_STEP * 2

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

  useEffect(() => {
    const id = setInterval(() => {
      setActiveStep((i) => (i + 1) % steps.length)
    }, STEP_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  // Log da seção "COMO FUNCIONA": a faixinha pequena com rolagem contínua de
  // volta, mas mantendo os 3 estágios sem cor (pendente/carregando/concluído)
  // e sem mostrar resultado antes da hora. Pra isso, em vez de deixar o
  // framer-motion animar sozinho via prop `animate`, controlamos a posição
  // com um motionValue e escutamos cada atualização pra calcular `logPos` —
  // até qual linha já foi processada nesse ciclo (0 = nenhuma ainda,
  // contextRows.length = todas). A faixa mostra 2 cópias da lista: a primeira
  // usa `logPos` pra decidir pendente/carregando/concluído linha a linha; a
  // segunda (a "próxima volta", que só aparece espiando lá embaixo) fica
  // sempre pendente, porque ela ainda nem começou.
  const contextScrollY = useMotionValue(0)
  const [logPos, setLogPos] = useState(0)

  useEffect(() => {
    const controls = animateValue(contextScrollY, [0, -CONTEXT_LOOP_DISTANCE], {
      duration: CONTEXT_LOOP_DURATION,
      repeat: Infinity,
      ease: 'linear',
    })
    return controls.stop
  }, [])

  useEffect(() => {
    return contextScrollY.on('change', (latest) => {
      const raw = Math.floor((-latest + ROW_STEP) / ROW_STEP)
      const pos = Math.min(Math.max(raw - 1, 0), contextRows.length)
      setLogPos((current) => (current === pos ? current : pos))
    })
  }, [])

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

      {/* Versão mobile dos mesmos 5 passos: em vez do carrossel horizontal
          (que dava trabalho pra impedir o usuário de arrastar e ainda
          precisava de scroll pra ver os 5), aqui é o mesmo cartão do
          desktop (ícone+número, título, descrição) mostrando só o passo
          ativo, com fade na troca. Nada aqui rola: não tem o que "corrigir"
          porque não existe scroll. */}
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
          {/* Barra fora do AnimatePresence do texto de propósito: ela precisa
              reiniciar exatamente quando activeStep muda, sem esperar o fade
              do texto terminar — senão desalinha do STEP_INTERVAL_MS real. */}
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
            style={{ y: contextScrollY, paddingTop: CONTEXT_VISUAL_BUFFER }}
          >
            {[0, 1].flatMap((copy) =>
              contextRows.map((row, i) => {
                const Icon = row.icon
                const FinalIcon = row.final === 'none' ? XCircle : CheckCircle2
                // Cópia 0 é a volta atual (usa logPos pra saber onde já
                // passou); cópia 1 é a próxima volta espiando lá embaixo —
                // ainda nem começou, então fica sempre pendente.
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
              })
            )}
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
