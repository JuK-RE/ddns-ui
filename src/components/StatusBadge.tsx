import { useI18n } from '../i18n/context'
import { STATUS_PAGE_URL, useServiceStatus } from '../hooks/useServiceStatus'
import './StatusBadge.css'

export function StatusBadge() {
  const { messages: t } = useI18n()
  const { state, loading } = useServiceStatus()

  const activeState = state ?? 'fallback'
  const label = loading ? t.status.loading : t.status[activeState]

  return (
    <a
      className={`status-badge status-${loading ? 'loading' : activeState}`}
      href={STATUS_PAGE_URL}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={`${t.status.label}: ${label}`}
    >
      <span className="status-dot"><span /></span>
      <span>{label}</span>
    </a>
  )
}
