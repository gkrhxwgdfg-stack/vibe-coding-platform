import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Ficelle de cuisine — deux usages dans l'arbre généalogique :
 *
 * - `Tape` (entre deux cartes d'un couple) : cordelette torsadée brun-
 *   terracotta qui relie les deux personnes, à la façon des cuisines
 *   traditionnelles. Remplace l'ancien scotch washi texturé.
 * - `TapeAddButton` (sur le bord droit d'une carte sans partenaire) :
 *   petite pastille « ficelle » avec un « + » pour inviter à accoler un
 *   partenaire (conjoint·e, copine…) à côté, même génération.
 */

interface TapeProps {
  /** Bord gauche de la ficelle, en px (relatif au canevas de l'arbre) */
  x: number
  /** Bord haut de la ficelle, en px */
  y: number
  /** Largeur du lien en px (l'écart entre les deux cartes) */
  width: number
  className?: string
}

/** Ficelle entre deux cartes d'un couple (décoration, non interactive) */
export function Tape({ x, y, width, className }: TapeProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('absolute pointer-events-none flex items-center', className)}
      style={{ left: x, top: y, width, height: 26 }}
    >
      {/* Cordelette torsadée tendue entre les deux polaroïds */}
      <span
        className="block w-full h-1.5 rounded-full"
        style={{
          background:
            'repeating-linear-gradient(90deg, var(--color-terra) 0px, var(--color-terra) 5px, var(--color-ficelle) 5px, var(--color-ficelle) 10px)',
          boxShadow: '0 1px 2px rgba(74, 55, 40, 0.3)',
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

/** Pastille « + » ficelle cliquable sur le bord droit d'une carte (ajouter un partenaire) */
export function TapeAddButton({ memberName, onClick }: TapeAddButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Ajouter un partenaire à côté de ${memberName}`}
      title={`Ajouter un partenaire à côté de ${memberName} (même génération)`}
      className={cn(
        'absolute -right-3.5 top-24 z-10 touch-target-lg min-h-11 min-w-11 rounded-full shadow-card',
        'inline-flex items-center justify-center transition-transform hover:scale-110 active:scale-95',
      )}
      style={{
        background:
          'radial-gradient(circle at 35% 30%, var(--color-terra-dark) 0%, var(--color-ficelle) 100%)',
        border: '2px solid rgba(251, 246, 236, 0.85)',
      }}
    >
      <Plus size={18} strokeWidth={3} className="text-creme drop-shadow" aria-hidden="true" />
    </button>
  )
}
