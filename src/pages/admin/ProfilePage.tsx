import { useNavigate } from 'react-router-dom'
import { LogOut, RefreshCw } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { getAvatarUrl } from '../../lib/avatar'
import { hasSessionHint } from '../../lib/api'
import { Button } from '../../ui'
import { PageHeader } from './PageHeader'

export function ProfilePage() {
  const { user, loading, lastError, refresh, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  async function handleLogout() {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <>
      <PageHeader
        title="Meu perfil"
        description="Dados da sua conta, vindos do provedor OAuth usado no login."
        actions={
          <Button variant="outline" className="ui-btn--danger" onClick={() => void handleLogout()}>
            <LogOut size={15} /> Sair
          </Button>
        }
      />

      <section className="admin-card">
        <div className="admin-profile">
          <img src={getAvatarUrl(user)} alt="" />
          <div>
            <h2 style={{ margin: 0 }}>{user.name ?? user.username ?? 'Usuário'}</h2>
            {user.username && <span>@{user.username}</span>}
          </div>
        </div>

        <dl className="admin-dl">
          <dt>E-mail</dt>
          <dd>{user.email ?? '—'}</dd>
          <dt>Usuário</dt>
          <dd>{user.username ?? '—'}</dd>
          <dt>ID</dt>
          <dd>{user.id}</dd>
          <dt>Conta criada em</dt>
          <dd>{new Date(user.created_at).toLocaleString('pt-BR')}</dd>
        </dl>
      </section>

      {/* Painel de debug temporário (veio da antiga /auth) — pode remover
          depois que o login estiver estável. */}
      <section className="admin-card">
        <details className="debug-box">
          <summary>Debug: estado da sessão</summary>
          <button type="button" onClick={() => void refresh()}>
            <RefreshCw size={12} style={{ verticalAlign: '-2px', marginRight: 6 }} />
            Recarregar /auth/me
          </button>
          {lastError && <p className="error">Erro: {lastError}</p>}
          <pre>{JSON.stringify({ loading, user, sessaoNesteNavegador: hasSessionHint() }, null, 2)}</pre>
        </details>
      </section>
    </>
  )
}
