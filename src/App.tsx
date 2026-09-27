import { Navigate, Route, Routes } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { AuthPage } from './pages/AuthPage'
import { GuestOnly, RootGate } from './routes/guards'
import { OverviewPage } from './pages/admin/OverviewPage'
import { SessionsPage } from './pages/admin/SessionsPage'
import { VersionsPage } from './pages/admin/VersionsPage'
import { ProfilePage } from './pages/admin/ProfilePage'
import { HostsPage } from './pages/admin/HostsPage'
import { HostCreatePage } from './pages/admin/HostCreatePage'
import { HostDetailPage } from './pages/admin/HostDetailPage'

// Mapa de rotas:
// - "/"        → logado: painel (visão geral) · visitante: landing page
// - "/home"    → landing page, sempre (é por aqui que o logado acessa a LP)
// - "/auth"    → tela de login (logado é mandado de volta pro painel)
// - "/hosts", "/hosts/new", "/hosts/:id", "/sessions", "/versions", "/profile" → painel (visitante vai pro /auth)
function App() {
  return (
    <Routes>
      <Route path="/home" element={<LandingPage />} />

      <Route element={<GuestOnly />}>
        <Route path="/auth" element={<AuthPage />} />
      </Route>

      <Route path="/" element={<RootGate />}>
        <Route index element={<OverviewPage />} />
        <Route path="hosts" element={<HostsPage />} />
        <Route path="hosts/new" element={<HostCreatePage />} />
        <Route path="hosts/:id" element={<HostDetailPage />} />
        <Route path="sessions" element={<SessionsPage />} />
        <Route path="versions" element={<VersionsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
