export type User = {
  id: number
  username: string | null
  email: string | null
  name: string | null
  avatar_url: string | null
  created_at: string
}

export type Session = {
  id: string
  provider: string
  created_at: string
  expires_at: string
  revoked_at: string | null
}
