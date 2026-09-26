import { SessionsPanel } from '../../components/SessionsPanel'
import { PageHeader } from './PageHeader'

export function SessionsPage() {
  return (
    <>
      <PageHeader
        title="Sessões"
        description="Cada login (dispositivo/navegador) vira uma sessão. Desconecte remotamente qualquer uma que você não reconheça."
      />
      <div className="admin-card">
        <SessionsPanel showTitle={false} />
      </div>
    </>
  )
}
