import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CordeALingeProps {
  children: ReactNode
  className?: string
}

/**
 * Corde à linge (§5.1) : les photos familiales pendent en polaroïds,
 * aucune grille neutre. La corde est un path courbé pleine largeur,
 * affaissé au milieu — décor pur, sous le contenu.
 */
export function CordeALinge({ children, className }: CordeALingeProps) {
  return (
    <div className={cn('relative pt-8', className)}>
      <svg
        className="absolute -top-1 left-0 w-full h-14 pointer-events-none"
        viewBox="0 0 380 60"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M-5 20 C 100 52, 280 52, 385 20"
          stroke="#8A5A2B"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      <div className="flex flex-wrap gap-6 justify-center">{children}</div>
    </div>
  )
}
