import { cn } from '@/lib/utils'

interface SparkleProps {
  className?: string
  /** Scintillement d'ambiance (3,5 s) — coupé si prefers-reduced-motion */
  animated?: boolean
}

/**
 * M2 — Étoile de scintillement : feedback & succès (§5.2).
 * Décor sous le contenu : aria-hidden, jamais seul porteur d'information.
 */
export function Sparkle({ className, animated = true }: SparkleProps) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      className={cn(animated && 'scintille', className)}
      aria-hidden="true"
    >
      <path
        d="M12 3C12.6 6.5 14.5 8.4 18 9c-3.5.6-5.4 2.5-6 6-.6-3.5-2.5-5.4-6-6 3.5-.6 5.4-2.5 6-6z"
        fill="#E4A93C"
      />
    </svg>
  )
}
