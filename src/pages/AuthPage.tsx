import { useAuth } from '../auth/AuthContext'
import { VersionsPanel } from '../components/VersionsPanel'
import { SessionsPanel } from '../components/SessionsPanel'
import { hasStoredToken } from '../lib/api'
import { getAvatarUrl } from '../lib/avatar'
import '../App.css'

export function AuthPage() {
  const { user, loading, lastError, logout, refresh, loginUrl, loginUrlGoogle } = useAuth()

  return (
    <main className="app">
      <header className="app-header">
        <h1>JUK.re DDNS</h1>

        {loading ? (
          <span className="muted">Carregando…</span>
        ) : user ? (
          <div className="user-info">
            <img src={getAvatarUrl(user)} alt={user.username ?? user.name ?? 'avatar'} className="avatar" />
            <span>{user.name ?? user.username}</span>
            <button type="button" onClick={() => void logout()}>
              Sair
            </button>
          </div>
        ) : (
          <div className="login-buttons">
            <a className="login-button" href={loginUrl}>
              Entrar com GitHub
            </a>
            <a className="login-button" href={loginUrlGoogle}>
              Entrar com Google
            </a>
          </div>
        )}
      </header>

      {!loading && !user && (
        <p className="muted login-hint">Entre com GitHub ou Google pra registrar uma nova versão.</p>
      )}

      {/* Painel de debug temporário — pode remover depois que o login
          estiver estável. */}
      <details className="debug-box" open={!user}>
        <summary>Debug: estado da sessão</summary>
        <button type="button" onClick={() => void refresh()}>
          Recarregar /auth/me
        </button>
        {lastError && <p className="error">Erro: {lastError}</p>}
        <pre>{JSON.stringify({ loading, user, tokenSalvo: hasStoredToken() }, null, 2)}</pre>
      </details>

      <SessionsPanel />
      <VersionsPanel />
    </main>
  )
}
