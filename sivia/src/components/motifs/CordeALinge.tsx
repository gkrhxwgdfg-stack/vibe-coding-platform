import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CordeALingeProps {
  children: ReactNode
  className?: string
}

/**
 * Corde à linge (§5.1) — version « filet double » de cuisine.
 *
 * Plus de dégradé flou : deux fils fins et proches (comme le filet double
 * qui sépare les sections d'une page recette) tendus derrière les photos.
 * Les épingles bois et la balance des polaroïds font le reste du charme.
 */
export function CordeALinge({ children, className }: CordeALingeProps) {
  return (
    <div className={cn('relative pt-8', className)}>
      {/* La corde : deux fils fins, l'un sous l'autre, très proches */}
      <div aria-hidden="true" className="absolute inset-x-0 top-5 pointer-events-none">
        <div className="h-px bg-encre-doux/50" />
        <div className="h-px bg-encre-doux/50 mt-[3px]" />
      </div>
      <div className="relative flex flex-wrap gap-6 justify-center">{children}</div>
    </div>
  )
}
