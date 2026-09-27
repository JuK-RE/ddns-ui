import { KeyRound, TriangleAlert } from 'lucide-react'
import { CopyButton } from './CopyButton'

/** Mostra o token completo (só existe agora) com aviso pra guardar. */
export function TokenReveal({ token }: { token: string }) {
  return (
    <div className="host-token">
      <div className="host-token-head">
        <KeyRound size={15} />
        <strong>Token de atualização</strong>
      </div>
      <div className="host-token-value">
        <code>{token}</code>
        <CopyButton text={token} label="Copiar token" />
      </div>
      <p className="host-token-warn">
        <TriangleAlert size={14} />
        Guarde agora. Por segurança, ele não será exibido de novo (dá para gerar outro depois).
      </p>
    </div>
  )
}
