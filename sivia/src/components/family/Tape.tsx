import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Lien de couple dans l'arbre — version douce en fond flouté.
 *
 * - `Tape` (entre deux cartes d'un couple) : bande horizontale floue
 *   cannelle (dégradé latéral + flou doux), posée en arrière-plan entre
 *   les deux polaroïds. Comme la corde de la planche : décor simple,
 *   lisse, aucune forme à aligner avec l'inclinaison des cartes —
 *   masqué d'elle-même si l'écart est trop court (< 20 px).
 * - `TapeAddButton` (sur le bord droit d'une carte sans partenaire) :
 *   contrôle moderne et épuré, aligné sur les autres « + » de l'arbre
 *   (carte blanche, bordure verte) — jamais de cannelle sur un bouton.
 */

interface TapeProps {
  /** Bord gauche du lien, en px (relatif au canevas de l'arbre) */
  x: number
  /** Bord haut du lien, en px */
  y: number
  /** Largeur du lien en px (l'écart entre les deux cartes) */
  width: number
  className?: string
}

/** Lien flou entre deux cartes d'un couple (décoration, non interactive) */
export function Tape({ x, y, width, className }: TapeProps) {
  const w = Math.max(width, 0)
  if (w < 20) return null // trop court pour lire un lien : on ne l'affiche pas
  return (
    <div
      aria-hidden="true"
      className={cn('absolute pointer-events-none', className)}
      style={{
        left: x,
        top: y - 3,
        width: w,
        height: 8,
        zIndex: 0,
        background:
          'linear-gradient(90deg, transparent, rgba(138, 90, 43, 0.45) 30%, rgba(138, 90, 43, 0.45) 70%, transparent)',
        filter: 'blur(1.5px)',
        borderRadius: 999,
      }}
    />
  )
}

interface TapeAddButtonProps {
  /** Prénom de la personne à laquelle on accole un partenaire */
  memberName: string
  onClick: () => void
}

/** Bouton « + » partenaire sur le bord droit d'une carte (contrôle moderne) */
export function TapeAddButton({ memberName, onClick }: TapeAddButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Ajouter un partenaire à côté de ${memberName}`}
      title={`Ajouter un partenaire à côté de ${memberName} (même génération)`}
      className={cn(
        'absolute -right-3.5 top-24 z-10 inline-flex items-center justify-center',
        'w-11 h-11 rounded-full bg-carte border-2 border-vert text-vert',
        'transition-transform hover:scale-110 hover:bg-vert-clair active:scale-95',
      )}
    >
      <Plus size={18} strokeWidth={3} aria-hidden="true" />
    </button>
  )
}
