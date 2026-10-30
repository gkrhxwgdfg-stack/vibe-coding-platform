import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'ghost' | 'outline' | 'danger'
type ButtonSize = 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variants: Record<ButtonVariant, string> = {
  // Primaire : tomate, pill 999 px, min-height 52 px (§6.1) — zéro ornement
  primary:
    'bg-tomate text-white hover:bg-[#a72f23] border-transparent rounded-full min-h-13',
  // Secondaire : transparent, bordure 2 px vert, texte vert (§6.1)
  secondary:
    'bg-transparent text-vert border-vert hover:bg-vert-clair',
  // Soft : fond vert-clair, texte vert (§6.1)
  soft:
    'bg-vert-clair text-vert border-transparent hover:brightness-95',
  ghost:
    'bg-transparent text-encre hover:bg-vert-clair border-transparent',
  outline:
    'bg-carte text-encre border-encre-doux/20 hover:border-vert hover:text-vert',
  danger:
    'bg-tomate text-white hover:bg-[#a72f23] border-transparent',
}

const sizes: Record<ButtonSize, string> = {
  md: 'min-h-11 px-5 py-2.5 text-base rounded-2xl',
  lg: 'touch-target-lg min-h-13 px-7 py-3.5 text-lg rounded-full',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-extrabold border-2 transition-[filter,colors] duration-200 ease-out',
        'disabled:opacity-45 disabled:cursor-not-allowed active:scale-[0.98]',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
)
Button.displayName = 'Button'
