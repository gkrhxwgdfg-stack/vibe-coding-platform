import { usePrefersReducedMotion } from '@/lib/motion'

/**
 * Confettis papier de l'écran « C'est prêt ! » : chutes colorées (terracotta,
 * moutarde, sauge, lin) pendant 1.8 s, une fois. Si l'utilisateur demande
 * moins de mouvement, aucun confetti n'est rendu (l'écran reste lisible).
 */
export function ConfettiPaper() {
  const reducedMotion = usePrefersReducedMotion()
  if (reducedMotion) return null

  const colors = ['#c93a2b', '#e4a93c', '#2e5939', '#f9efdb', '#8a5a2b']
  const pieces = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    left: (i * 37) % 100,
    delay: (i % 6) * 0.15,
    duration: 1.4 + (i % 4) * 0.2,
    color: colors[i % colors.length],
    size: 6 + (i % 3) * 3,
    drift: ((i % 5) - 2) * 24,
  }))

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece rounded-[2px]"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.6,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            // Dérive latérale via une translation encapsulée dans la chute
            ['--drift' as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  )
}
