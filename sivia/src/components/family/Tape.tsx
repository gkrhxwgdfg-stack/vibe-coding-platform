import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Ficelle de cuisine — deux usages dans l'arbre généalogique :
 *
 * - `Tape` (entre deux cartes d'un couple) : ficelle SVG en arc légèrement
 *   affaissé (absorbe visuellement l'inclinaison des polaroïds), double
 *   trait cannelle + chape bois pointillée (illusion de torsade à n'importe
 *   quelle largeur), nœuds aux deux extrémités. Masquée d'elle-même si
 *   l'écart est trop court (< 20 px) pour lire une ficelle.
 * - `TapeAddButton` (sur le bord droit d'une carte sans partenaire) :
 *   contrôle moderne et épuré, aligné sur les autres « + » de l'arbre
 *   (carte blanche, bordure verte) — jamais de dégradé cannelle sur un
 *   bouton : le cannelle est réservé aux line-arts patrimoniaux.
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
  const w = Math.max(width, 0)
  if (w < 20) return null // trop court pour lire une ficelle : on ne l'affiche pas
  const sag = Math.min(10, Math.round(w * 0.22) + 4) // affaissement doux, borné
  const W = w + 12 // marges pour les nœuds
  const H = sag + 14
  const arc = `M6 9 Q ${W / 2} ${9 + sag * 2} ${W - 6} 9`
  return (
    <svg
      aria-hidden="true"
      className={cn('absolute pointer-events-none', className)}
      style={{ left: x - 6, top: y - 9, width: W, height: H, zIndex: 0 }}
      viewBox={`0 0 ${W} ${H}`}
    >
      {/* Cordelette : arc affaissé */}
      <path d={arc} fill="none" stroke="var(--color-cannelle)" strokeWidth={2.5} strokeLinecap="round" />
      {/* Torsade : chape bois pointillée par-dessus */}
      <path d={arc} fill="none" stroke="var(--color-bois)" strokeWidth={1.25} strokeLinecap="round" strokeDasharray="4 5" />
      {/* Nœuds aux extrémités */}
      <circle cx={6} cy={9} r={2.6} fill="var(--color-bois)" />
      <circle cx={W - 6} cy={9} r={2.6} fill="var(--color-bois)" />
    </svg>
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
        'w-11 h-11 rounded-full bg-carte border-2 border-vert text-vert shadow-card',
        'transition-transform hover:scale-110 hover:bg-vert-clair active:scale-95',
      )}
    >
      <Plus size={18} strokeWidth={3} aria-hidden="true" />
    </button>
  )
}
