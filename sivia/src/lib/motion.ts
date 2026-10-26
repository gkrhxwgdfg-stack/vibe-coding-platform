import { useEffect, useState } from 'react'

/**
 * Tokens de motion Savia (dossier de raffinement v2, section 3).
 * Toute durée ou courbe d'animation passe par ici — aucune valeur magique
 * dans les composants. Les utilitaires CSS (.anim-enter, .anim-press,
 * .skeleton-paper) consomment les mêmes valeurs.
 */

export const MOTION = {
  /** Réponse immédiate d'un contrôle (hover, focus, apparition d'un toast) */
  durationInstant: 150,
  /** Transition courte d'état (ouverture d'un panneau, coche d'ingrédient) */
  durationFast: 250,
  /** Transition de page / entrée d'un écran */
  durationPage: 350,
  /** Cérémonie : tampon, entrée en mode cuisson, écran de fin */
  durationSlow: 600,
  /** Courbe standard Savia : départ doux, arrivée posée */
  easingStandard: 'cubic-bezier(0.22, 1, 0.36, 1)',
  /** Ressort doux pour les cascades (cartes, polaroïds) */
  easingSpring: 'cubic-bezier(0.34, 1.4, 0.4, 1)',
  /** Décalage entre deux éléments d'une cascade de cartes */
  stagger: 40,
  /** Décalage entre deux polaroïds de la planche */
  staggerPlanche: 60,
} as const

/**
 * Rotation stable d'un polaroïd à partir de son identifiant : même id, même
 * biais, à chaque rendu et à chaque visite. Jamais d'aléatoire.
 */
export function stableTilt(id: string, range = 2.5): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  }
  return ((hash % 1000) / 1000) * range * 2 - range
}

/**
 * Sélection stable « plat du dimanche » : la graine est la date AAAAMMJJ,
 * le même choix toute la journée, différent d'un jour à l'autre.
 */
export function pickDaily<T>(items: readonly T[], date = new Date()): T | null {
  if (items.length === 0) return null
  const seed =
    date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()
  // Multiplicateur de Lehmer : dispersion stable d'un jour à l'autre
  const mixed = (seed * 2654435761) >>> 0
  return items[mixed % items.length]
}

/** Media query d'accessibilité : l'utilisateur demande moins de mouvement */
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

/**
 * S'abonne à `prefers-reduced-motion`. Toute animation non essentielle
 * doit être court-circuitée quand ce hook retourne `true`.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia(REDUCED_MOTION_QUERY).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const media = window.matchMedia(REDUCED_MOTION_QUERY)
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches)
    setReduced(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return reduced
}
