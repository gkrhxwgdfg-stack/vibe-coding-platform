import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CordeALingeProps {
  children: ReactNode
  className?: string
}

/**
 * Corde à linge (§5.1) — version lisse en fond pur.
 *
 * Une seule courbe douce en `radial-gradient` (deux halos cannelle très
 * légers qui se rejoignent), posée en arrière-plan de la zone des photos :
 * rien à aligner, aucune tuile, aucune couture, aucun chevauchement
 * possible — le décor reste derrière le contenu quel que soit l'écran.
 * La balance des polaroïds et leurs épingles bois fait le reste du charme.
 */
export function CordeALinge({ children, className }: CordeALingeProps) {
  return (
    <div className={cn('relative pt-6', className)}>
      {/* Courbe de corde en arrière-plan : halos doux, zéro risque visuel */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-3 h-5 pointer-events-none"
        style={{
          background:
            'radial-gradient(60% 100% at 20% 0%, rgba(138, 90, 43, 0.34), transparent 70%), radial-gradient(60% 100% at 80% 0%, rgba(138, 90, 43, 0.34), transparent 70%)',
        }}
      />
      <div className="relative flex flex-wrap gap-6 justify-center">{children}</div>
    </div>
  )
}
