import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Lien de couple dans l'arbre — « filet double » de cuisine.
 *
 * - `Tape` (entre deux cartes d'un couple) : deux fils fins et proches
 *   (le même filet double que la corde de la planche et les séparateurs
 *   de la page recette), lisses, sans flou ni dégradé — masqué d'office
 *   si l'écart est trop court (< 20 px).
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

/** Lien « filet double » entre deux cartes d'un couple (décoration, non interactive) */
export function Tape({ x, y, width, className }: TapeProps) {
  const w = Math.max(width, 0)
  if (w < 20) return null // trop court pour lire un lien : on ne l'affiche pas
  return (
    <div
      aria-hidden="true"
      className={cn('absolute pointer-events-none', className)}
      style={{
        left: x,
        top: y,
        width: w,
        borderTop: '4px double rgba(107, 93, 79, 0.5)',
        zIndex: 0,
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
