import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { SiGithub } from 'react-icons/si'
import { FcGoogle } from 'react-icons/fc'
import { useAuth } from '../auth/AuthContext'
import { AnimatedLine, BrandLockup, ButtonLink, SiteFooter, SiteNav } from '../ui'
import { usePageMeta } from '../seo/usePageMeta'
import './AuthPage.css'

// Tela de login. Não tem formulário: todo acesso passa por OAuth
// (GitHub ou Google). O botão navega pra /api/auth/{provider} no próprio
// domínio; o backend faz o OAuth, grava a sessão num cookie httpOnly e
// devolve pra cá com ?login=success|error (tratado no AuthContext).
// Se o usuário já estiver logado, o <GuestOnly /> nem deixa chegar aqui.
//
// Usa a mesma "moldura" da landing (coluna de 1126px com bordas, nav,
// linhas tracejadas e rodapé) pra manter a identidade.
export function AuthPage() {
  const { loginUrl, loginUrlGoogle, lastError, loginError } = useAuth()
  usePageMeta({
    title: 'Entrar',
    description: 'Entre no JUK.re DDNS com sua conta Google ou GitHub. Se ainda não tiver conta, ela é criada no primeiro acesso.',
    path: '/auth',
    noindex: true,
  })

  return (
    <div className="auth-page">
      <SiteNav>
        <ButtonLink variant="ghost" size="sm" to="/home">
          <ArrowLeft size={14} />
          Voltar para o site
        </ButtonLink>
      </SiteNav>

      <AnimatedLine dashed edge="page" />

      <main className="auth-main">
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <BrandLockup height={15} />

          <h1>Entrar no JUK.re</h1>
          <p className="auth-lede">Acesse sua conta para continuar.</p>

          <div className="auth-providers">
            <ButtonLink variant="outline" block href={loginUrlGoogle}>
              <FcGoogle size={18} />
              Continuar com Google
            </ButtonLink>
            <ButtonLink variant="outline" block href={loginUrl}>
              <SiGithub size={17} />
              Continuar com GitHub
            </ButtonLink>
          </div>

          {(loginError || lastError) && (
            <p className="auth-error" role="alert">
              {loginError
                ? 'Não foi possível concluir o login. Tente novamente.'
                : 'Não foi possível falar com o servidor agora. Tente novamente em instantes.'}
            </p>
          )}

          <div className="auth-divider">
            <span>Ainda não tem conta?</span>
          </div>

          <p className="auth-note">
            Sem problema: se você ainda não tiver uma conta, ela será criada automaticamente no seu primeiro acesso
            com Google ou GitHub.
          </p>
        </motion.div>
      </main>

      <AnimatedLine dashed edge="page" />

      <SiteFooter />
    </div>
  )
}
