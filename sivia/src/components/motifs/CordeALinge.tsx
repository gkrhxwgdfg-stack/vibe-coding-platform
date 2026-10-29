import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const CORDE_TILE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='36' viewBox='0 0 240 36'%3E%3Cpath d='M0 12 Q60 30 120 24 Q180 30 240 12' fill='none' stroke='%238A5A2B' stroke-width='2.5' stroke-linecap='round'/%3E%3C/svg%3E\")"

interface CordeALingeProps {
  children: ReactNode
  className?: string
}

/**
 * Corde à linge (§5.1) : bande décorative en tuile fixe de 240 × 36 px
 * répétée horizontalement (`repeat-x`). La forme de l'affaissement est
 * identique sur tous les écrans, et puisque la bande occupe ses propres
 * 36 px au-dessus des photos, la corde ne peut jamais croiser une photo.
 * Les épingles des polaroïds remontent dans la bande (`-mt-2`) : chaque
 * photo paraît pincée à la corde.
 */
export function CordeALinge({ children, className }: CordeALingeProps) {
  return (
    <div className={cn('relative', className)}>
      <div
        aria-hidden="true"
        className="h-9 w-full pointer-events-none"
        style={{ backgroundImage: CORDE_TILE, backgroundRepeat: 'repeat-x', backgroundSize: '240px 36px' }}
      />
      {/* Les polaroïds commencent sous la bande ; les épingles remontent dedans */}
      <div className="flex flex-wrap gap-6 justify-center -mt-2">{children}</div>
    </div>
  )
}
