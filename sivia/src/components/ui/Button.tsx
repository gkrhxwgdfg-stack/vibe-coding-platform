import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'ghost' | 'outline' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variants: Record<ButtonVariant, string> = {
  // Primaire : tomate pleine — le geste le plus important de l'écran (§6.1).
  // La forme (pilule) et la hauteur viennent de la taille, jamais de la variante.
  primary:
    'bg-tomate text-white hover:bg-[#a72f23] border-transparent',
  // Secondaire : transparent, bordure 2 px vert, texte vert (§6.1)
  secondary:
    'bg-transparent text-vert border-vert hover:bg-vert-clair',
  // Soft : fond vert-clair, texte vert (§6.1)
  soft:
    'bg-vert-clair text-vert border-transparent hover:brightness-95',
  ghost:
    'bg-transparent text-encre hover:bg-vert-clair border-transparent',
  outline:
    'bg-carte text-encre border-encre-doux/35 hover:border-vert hover:text-vert',
  danger:
    'bg-tomate text-white hover:bg-[#a72f23] border-transparent',
}

// Une seule forme — la pilule : hiérarchie par la couleur, jamais par la forme
// (conventions Material 3 / HIG 2026, interfaces calmes). La légèreté vient du
// poids bold et des paddings resserrés ; la cible tactile reste ≥ 44 px
// (Apple HIG / WCAG 2.5.8) et 48 px pour lg, réservé aux écrans d'arrivée
// (auth, paywall, « C'est prêt ! »). En grande lecture, touch-target-lg
// monte automatiquement les cibles à 52 px pour les aînés.
const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-4 py-1 text-sm gap-1.5 rounded-full',
  md: 'min-h-11 px-5 py-1.5 text-base rounded-full',
  lg: 'touch-target-lg min-h-12 px-6 py-2 text-base rounded-full',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-bold border-2 transition-[filter,colors] duration-200 ease-out',
        'cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed active:scale-[0.98]',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
)
Button.displayName = 'Button'
