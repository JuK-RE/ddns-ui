import type { HostStatus } from '../../types'
import { STATUS_LABEL } from '../../lib/hosts'

export function HostStatusBadge({ status }: { status: HostStatus }) {
  return (
    <span className={`host-status host-status--${status}`}>
      <span className="host-status-dot" aria-hidden="true" />
      {STATUS_LABEL[status]}
    </span>
  )
}
