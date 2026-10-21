import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Scotch adhésif artisanal — deux usages dans l'arbre généalogique :
 *
 * - `Tape` (entre deux cartes d'un couple) : ruban qui « scotche » les deux
 *   personnes ensemble, à cheval sur le bord des deux polaroïds, légèrement
 *   incliné. Remplace l'ancienne ligne + point.
 * - `TapeAddButton` (sur le bord droit d'une carte sans partenaire) : petit
 *   scotch avec un « + » qui invite à accoler un partenaire (conjoint·e,
 *   copine…) à côté de la personne, même génération.
 */

interface TapeProps {
  /** Bord gauche du scotch, en px (relatif au canevas de l'arbre) */
  x: number
  /** Bord haut du scotch, en px */
  y: number
  /** Largeur du scotch en px (l'écart entre les deux cartes) */
  width: number
  className?: string
}

/** Scotch entre deux cartes d'un couple (décoration, non interactif) */
export function Tape({ x, y, width, className }: TapeProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('absolute pointer-events-none', className)}
      style={{ left: x, top: y, width, height: 26 }}
    >
      <div
        className="w-full h-full rounded-sm shadow-card"
        style={{
          background:
            'linear-gradient(105deg, rgba(217,164,65,0.85) 0%, rgba(217,164,65,0.65) 45%, rgba(196,100,58,0.7) 100%)',
          transform: 'rotate(-2deg)',
          borderLeft: '2px dashed rgba(251,246,236,0.6)',
          borderRight: '2px dashed rgba(251,246,236,0.6)',
        }}
      />
    </div>
  )
}

interface TapeAddButtonProps {
  /** Prénom de la personne à laquelle on accole un partenaire */
  memberName: string
  onClick: () => void
}

/** Petit scotch « + » cliquable sur le bord droit d'une carte (ajouter un partenaire) */
export function TapeAddButton({ memberName, onClick }: TapeAddButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Ajouter un partenaire à côté de ${memberName}`}
      title={`Ajouter un partenaire à côté de ${memberName} (même génération)`}
      className={cn(
        'absolute -right-3 top-24 z-10 min-h-11 min-w-11 rounded-sm shadow-card',
        'inline-flex items-center justify-center transition-transform hover:scale-110 active:scale-95',
      )}
      style={{
        background:
          'linear-gradient(105deg, rgba(217,164,65,0.9) 0%, rgba(217,164,65,0.7) 45%, rgba(196,100,58,0.75) 100%)',
        transform: 'rotate(3deg)',
        borderLeft: '2px dashed rgba(251,246,236,0.6)',
        borderRight: '2px dashed rgba(251,246,236,0.6)',
      }}
    >
      <Plus size={18} strokeWidth={3} className="text-creme drop-shadow" aria-hidden="true" />
    </button>
  )
}
