import { useEffect, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { KeyRound, Lock, MonitorSmartphone, ShieldCheck, Smartphone, Laptop } from 'lucide-react'
import { SiGithub } from 'react-icons/si'
import { FcGoogle } from 'react-icons/fc'
import { Eyebrow, IconBadge } from '../../ui'

// Intervalo da "demo" de revogação no card de sessões: a sessão do celular
// alterna entre ativa e revogada, simulando o "Desconectar" do painel.
const REVOKE_DEMO_MS = 3200

function CardHead({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="landing-sec-head">
      <IconBadge>{icon}</IconBadge>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  )
}

function SessionsMock() {
  const [revoked, setRevoked] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setRevoked((r) => !r), REVOKE_DEMO_MS)
    return () => clearInterval(id)
  }, [])

  const rows = [
    { key: 'laptop', icon: Laptop, provider: 'GitHub', device: 'Chrome · Windows', current: true, state: 'ativa' as const },
    {
      key: 'phone',
      icon: Smartphone,
      provider: 'Google',
      device: 'Safari · iPhone',
      current: false,
      state: revoked ? ('revogada' as const) : ('ativa' as const),
    },
    { key: 'old', icon: MonitorSmartphone, provider: 'GitHub', device: 'Firefox · Ubuntu', current: false, state: 'expirada' as const },
  ]

  return (
    <ul className="landing-sec-sessions" aria-hidden="true">
      {rows.map(({ key, icon: Icon, provider, device, current, state }) => (
        <li key={key} className={state !== 'ativa' ? 'is-off' : undefined}>
          <Icon size={15} />
          <div className="landing-sec-sessions-info">
            <strong>
              {provider}
              {current && <span className="landing-sec-chip">este dispositivo</span>}
            </strong>
            <span>{device}</span>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={state}
              className={`landing-sec-state landing-sec-state--${state}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              {state}
            </motion.span>
          </AnimatePresence>
          {key === 'phone' && state === 'ativa' && <span className="landing-sec-revoke">Desconectar</span>}
        </li>
      ))}
    </ul>
  )
}

/**
 * Seção de segurança em formato "bento": um card grande mostrando a lista
 * de sessões (com uma sessão sendo revogada em loop) e dois cards menores
 * — login via OAuth e segredos fora do código.
 */
export function SecuritySection() {
  return (
    <motion.section
      className="landing-sec"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="landing-sec-intro">
        <Eyebrow>Segurança</Eyebrow>
        <h2>Sessões isoladas. Tokens revogáveis.</h2>
        <p>Você decide quem continua conectado — e nenhuma senha precisa existir pra isso.</p>
      </div>

      <div className="landing-sec-bento">
        <article className="landing-sec-card landing-sec-card--main">
          <CardHead icon={<ShieldCheck size={17} />} title="Cada login é uma sessão">
            Todo acesso gera um token próprio, ligado ao dispositivo. Viu algo estranho? Desconecte na hora, sem
            esperar o token expirar.
          </CardHead>
          <SessionsMock />
        </article>

        <article className="landing-sec-card">
          <CardHead icon={<Lock size={17} />} title="Login sem senha">
            A autenticação fica com quem já faz isso bem. O JUK.re não guarda nenhuma credencial.
          </CardHead>
          <div className="landing-sec-providers" aria-hidden="true">
            <span>
              <FcGoogle size={16} /> Google
            </span>
            <span>
              <SiGithub size={15} /> GitHub
            </span>
          </div>
        </article>

        <article className="landing-sec-card">
          <CardHead icon={<KeyRound size={17} />} title="Segredos fora do código">
            Chaves e segredos vivem nas variáveis de ambiente da Cloudflare, nunca no repositório.
          </CardHead>
          <pre className="landing-sec-env" aria-hidden="true">
            <span>JWT_SECRET</span>=<i>••••••••••••</i>
            {'\n'}
            <span>GITHUB_CLIENT_SECRET</span>=<i>••••••••</i>
          </pre>
        </article>
      </div>
    </motion.section>
  )
}
