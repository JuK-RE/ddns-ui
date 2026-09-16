import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext'

type Version = {
  id: number
  version: string
  description: string | null
  created_at: string
}

export function VersionsPanel() {
  const { user } = useAuth()
  const [versions, setVersions] = useState<Version[]>([])
  const [version, setVersion] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data } = await api.get<{ versions: Version[] }>('/versions')
    setVersions(data.versions)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    try {
      await api.post('/versions', { version, description: description || undefined })
      setVersion('')
      setDescription('')
      load()
    } catch (err) {
      const data = (err as { response?: { data?: { error?: string } } }).response?.data
      setError(data?.error ?? 'Erro ao criar versão')
    }
  }

  return (
    <section className="versions-panel">
      <h2>Versões do sistema</h2>

      {user && (
        <form onSubmit={handleSubmit} className="versions-form">
          <input
            placeholder="versão (ex: 1.0.0)"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            required
          />
          <input
            placeholder="descrição (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button type="submit">Registrar versão</button>
          {error && <p className="error">{error}</p>}
        </form>
      )}

      <ul className="versions-list">
        {versions.length === 0 && <li className="empty">Nenhuma versão registrada ainda.</li>}
        {versions.map((v) => (
          <li key={v.id}>
            <strong>{v.version}</strong>
            {v.description && <span> — {v.description}</span>}
            <time>{new Date(v.created_at).toLocaleString('pt-BR')}</time>
          </li>
        ))}
      </ul>
    </section>
  )
}
