import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'ghost' | 'outline' | 'danger'
type ButtonSize = 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variants: Record<ButtonVariant, string> = {
  // Bouton « cuisson » : arrondi généreux, ombre douce — on clique comme on goûte
  primary:
    'bg-terra text-creme hover:bg-terra-dark shadow-soft border-transparent',
  ghost:
    'bg-transparent text-encre hover:bg-creme border-transparent',
  outline:
    'bg-creme text-encre border-encre/25 hover:border-terra hover:text-terra',
  danger:
    'bg-carmine text-creme hover:bg-[#9a3232] shadow-soft border-transparent',
}

const sizes: Record<ButtonSize, string> = {
  md: 'min-h-11 px-5 py-2.5 text-base rounded-2xl',
  lg: 'min-h-13 px-7 py-3.5 text-lg rounded-full',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-bold border-2 transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
)
Button.displayName = 'Button'
