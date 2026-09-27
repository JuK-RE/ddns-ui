import type { Connector } from '../../types'
import { CONNECTORS } from './connectors'

export function ConnectorPicker({ value, onChange }: { value: Connector | null; onChange: (c: Connector) => void }) {
  return (
    <div className="host-connectors" role="radiogroup" aria-label="Tipo de conexão">
      {CONNECTORS.map(({ id, title, description, icon: Icon, soon }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={value === id}
          disabled={soon}
          className={`host-connector ${value === id ? 'is-selected' : ''}`}
          onClick={() => onChange(id)}
        >
          <span className="host-connector-icon">
            <Icon size={18} />
          </span>
          <span className="host-connector-text">
            <strong>
              {title}
              {soon && <em>Em breve</em>}
            </strong>
            <span>{description}</span>
          </span>
        </button>
      ))}
    </div>
  )
}
