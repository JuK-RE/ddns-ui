import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { SessionsPanel } from '../../components/SessionsPanel'
import { getAvatarUrl } from '../../lib/avatar'
import { Button } from '../../ui'
import { PageHeader } from './PageHeader'

export function ProfilePage() {
  const { user, logout } = useAuth()
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
        description="Dados da sua conta, vindos do provedor usado no login, e os dispositivos conectados."
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
          <dt>Conta criada em</dt>
          <dd>{new Date(user.created_at).toLocaleDateString('pt-BR')}</dd>
        </dl>
      </section>

      <section className="admin-card">
        <h2>Dispositivos conectados</h2>
        <p className="admin-section-lead">
          Cada login (navegador ou dispositivo) vira uma sessão. Desconecte qualquer uma que você não reconheça.
        </p>
        <SessionsPanel showTitle={false} />
      </section>
    </>
  )
}
