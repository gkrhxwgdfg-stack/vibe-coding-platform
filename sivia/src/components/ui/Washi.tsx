import { cn } from '@/lib/utils'

type WashiCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

interface WashiProps {
  /** Coin du conteneur où poser le ruban */
  corner?: WashiCorner
  className?: string
}

/**
 * Ruban adhésif « washi » moutarde (rgba(217,164,65,0.35)), rotation −3°,
 * ombre légère. Se positionne sur un coin d'un polaroïd ou d'une planche.
 * Décoration pure : aria-hidden, jamais interactif.
 */
export function Washi({ corner = 'top-left', className }: WashiProps) {
  const position: Record<WashiCorner, string> = {
    'top-left': '-top-2 -left-3 -rotate-3',
    'top-right': '-top-2 -right-3 rotate-3',
    'bottom-left': '-bottom-2 -left-3 rotate-3',
    'bottom-right': '-bottom-2 -right-3 -rotate-3',
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        'absolute w-16 h-5 rounded-[2px] pointer-events-none shadow-[0_1px_3px_rgba(74,55,40,0.25)]',
        'bg-[rgba(217,164,65,0.35)]',
        position[corner],
        className,
      )}
    />
  )
}
