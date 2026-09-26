import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { buttonClass, type ButtonStyleProps } from './classes'

type ButtonProps = ButtonStyleProps & ButtonHTMLAttributes<HTMLButtonElement>

/** Botão da identidade JUK.re (pílula laranja por padrão — o mesmo CTA da landing). */
export function Button({ variant, size, block, className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass({ variant, size, block, className })} {...rest} />
}

type ButtonLinkProps = ButtonStyleProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
    /** Rota interna (react-router). */
    to?: string
    /** URL externa/absoluta (inclui os links de login da API). */
    href?: string
    external?: boolean
    children: ReactNode
  }

/** Mesmo visual do <Button />, mas como link (rota interna com `to`, ou URL com `href`). */
export function ButtonLink({ variant, size, block, className, to, href, external, ...rest }: ButtonLinkProps) {
  const cls = buttonClass({ variant, size, block, className })
  if (to) return <Link to={to} className={cls} {...rest} />
  return <a href={href} className={cls} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})} {...rest} />
}
