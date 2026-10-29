import { cn } from '@/lib/utils'

type TwineCorner = 'top-left' | 'top-right'

interface TwineProps {
  /** Côté du conteneur où nouer la ficelle */
  corner?: TwineCorner
  className?: string
}

/**
 * Ficelle de cuisine qui « attache » la carte au mur, façon Cuisine de
 * mamie : cordelette brun-terracotta avec un petit nœud, torsadée (motif
 * rayé fin). Remplace l'ancien ruban washi — plus simple et plus cuisine.
 * Décoration pure : aria-hidden, jamais interactif.
 */
export function Twine({ corner = 'top-left', className }: TwineProps) {
  const position: Record<TwineCorner, string> = {
    'top-left': '-top-3 left-4',
    'top-right': '-top-3 right-4',
  }
  return (
    <span
      aria-hidden="true"
      className={cn('absolute pointer-events-none w-10 h-9', position[corner], className)}
    >
      {/* Cordelette torsadée : petit segment penché */}
      <span
        className="absolute left-1/2 -translate-x-1/2 top-1 w-1.5 h-6 rounded-full rotate-[24deg]"
        style={{
          background:
            'repeating-linear-gradient(180deg, var(--color-terra) 0px, var(--color-terra) 3px, var(--color-ficelle) 3px, var(--color-ficelle) 6px)',
          boxShadow: '0 1px 2px rgba(74, 55, 40, 0.35)',
        }}
      />
      {/* Nœud de la ficelle */}
      <span
        className="absolute left-1/2 -translate-x-1/2 top-5 w-3 h-3 rounded-full"
        style={{
          background: 'var(--color-ficelle)',
          boxShadow: 'inset 0 -1px 1px rgba(255,255,255,0.25), 0 1px 2px rgba(74,55,40,0.35)',
        }}
      />
      {/* Les deux brins qui retombent */}
      <span
        className="absolute left-1/2 top-7 w-1 h-3 rounded-full -translate-x-[7px] rotate-[14deg]"
        style={{ background: 'var(--color-terra)' }}
      />
      <span
        className="absolute left-1/2 top-7 w-1 h-3 rounded-full translate-x-[3px] -rotate-[14deg]"
        style={{ background: 'var(--color-terra)' }}
      />
    </span>
  )
}
