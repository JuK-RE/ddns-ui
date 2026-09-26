export type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'dark'
export type ButtonSize = 'sm' | 'md' | 'lg'

export type ButtonStyleProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Largura total + cantos de 10px (usado nos botões de provider do login). */
  block?: boolean
  className?: string
}

export function buttonClass({ variant = 'primary', size = 'md', block = false, className }: ButtonStyleProps) {
  return ['ui-btn', `ui-btn--${variant}`, `ui-btn--${size}`, block && 'ui-btn--block', className].filter(Boolean).join(' ')
}
