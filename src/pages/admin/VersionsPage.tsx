import { VersionsPanel } from '../../components/VersionsPanel'
import { PageHeader } from './PageHeader'

export function VersionsPage() {
  return (
    <>
      <PageHeader title="Versões" description="Histórico de versões do sistema registradas no D1." />
      <div className="admin-card">
        <VersionsPanel showTitle={false} />
      </div>
    </>
  )
}
