import { useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const LEGEND_SEEN_KEY = 'savia-tree-legend-seen'

/**
 * Légende vivante de l'arbre : note manuscrite (Fraunces italique,
 * rotation −2°) affichée au premier passage sur la page Famille.
 * Explique les codes : fruits = recettes transmises, « + » vert =
 * enfant, « + » carmine = aîné·e, ficelle = couple. Dismissible,
 * mémorisée en localStorage (plus simple : la note revient à chaque
 * visite tant qu'elle n'a pas été fermée une fois).
 */
export function TreeLegend({ className }: { className?: string }) {
  const [visible, setVisible] = useState(() => {
    if (typeof localStorage === 'undefined') return true
    try {
      return localStorage.getItem(LEGEND_SEEN_KEY) !== '1'
    } catch {
      return true
    }
  })

  if (!visible) return null

  function dismiss() {
    setVisible(false)
    try {
      localStorage.setItem(LEGEND_SEEN_KEY, '1')
    } catch {
      /* stockage indisponible : la note reviendra, pas grave */
    }
  }

  return (
    <div
      className={cn(
        'relative font-serif italic text-encre-doux text-base leading-relaxed',
        'bg-ble-clair/70 rounded-2xl px-5 py-4 pr-12 max-w-md',
        'anim-enter',
        className,
      )}
      style={{ transform: 'rotate(-2deg)' }}
    >
      <p>
        <span aria-hidden="true">🍅</span> les fruits = les recettes transmises ·{' '}
        <span className="font-extrabold text-vert not-italic">+</span> vert = un enfant ·{' '}
        <span className="font-extrabold text-tomate not-italic">+</span> carmine = un aîné ·{' '}
        la ficelle = un couple.
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Fermer la légende de l'arbre"
        className="absolute top-2 right-2 touch-target-lg min-h-11 min-w-11 rounded-full text-encre-doux hover:text-encre flex items-center justify-center"
      >
        <X size={18} aria-hidden="true" />
      </button>
    </div>
  )
}
