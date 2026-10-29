/**
 * M1 — Pluie de farine (§5.6) : points de farine qui tombent sur le
 * header d'accueil uniquement. Décor aria-hidden ; coupée si
 * prefers-reduced-motion (les points restent posés, l'animation s'arrête).
 */
const DOTS = [
  { left: '6%', size: 5, delay: '0s', duration: '9s' },
  { left: '18%', size: 8, delay: '2.4s', duration: '8.2s' },
  { left: '31%', size: 4, delay: '1.1s', duration: '9.6s' },
  { left: '47%', size: 7, delay: '4.2s', duration: '8.8s' },
  { left: '63%', size: 5, delay: '3s', duration: '9.2s' },
  { left: '78%', size: 9, delay: '5.4s', duration: '8.4s' },
  { left: '91%', size: 4, delay: '2s', duration: '9.8s' },
]

export function PluieFarine() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {DOTS.map((dot, i) => (
        <span
          key={i}
          className="pluie-farine"
          style={{
            left: dot.left,
            width: dot.size,
            height: dot.size,
            animationDelay: dot.delay,
            animationDuration: dot.duration,
          }}
        />
      ))}
    </div>
  )
}
