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
