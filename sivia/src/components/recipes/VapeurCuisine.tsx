import { usePrefersReducedMotion } from '@/lib/motion'

/**
 * Vapeur du plat — l'écran « C'est prêt ! » du mode cuisson.
 *
 * En lieu et place des confettis : la fumée douce qui monte d'un plat chaud.
 * Cinq filaments flous, chacun son rythme, qui s'élèvent et se dissipent.
 * Rien ne tombe, rien ne claque : le plat sort du four, il fume, on passe
 * à table. Si l'utilisateur demande moins de mouvement, aucune vapeur
 * n'est rendue.
 */
export function VapeurCuisine() {
  const reducedMotion = usePrefersReducedMotion()
  if (reducedMotion) return null

  const wisps = Array.from({ length: 5 }, (_, i) => ({
    id: i,
    // Bande centrée derrière le titre et le polaroïd, jamais alignée au pixel
    left: 33 + i * 8.5 + (i % 2) * 3,
    bottom: 46 + (i % 3) * 4,
    delay: (i * 0.85) % 3.2,
    duration: 3.8 + (i % 3) * 0.8,
    height: 46 + (i % 2) * 22,
  }))

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {wisps.map((w) => (
        <span
          key={w.id}
          className="vapeur"
          style={{
            left: `${w.left}%`,
            bottom: `${w.bottom}%`,
            height: w.height,
            animationDelay: `${w.delay}s`,
            animationDuration: `${w.duration}s`,
          }}
        />
      ))}
    </div>
  )
}
