import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Clou SVG bois : ancre la corde au mur aux deux extrémités de la bande */
function Clou({ gauche }: { gauche: boolean }) {
  return (
    <svg
      width="10"
      height="12"
      viewBox="0 0 10 12"
      className="absolute top-0 pointer-events-none"
      style={gauche ? { left: 2 } : { right: 2 }}
      aria-hidden="true"
    >
      <circle cx="5" cy="4" r="3.4" fill="#B08968" />
      <path d="M5 4v7" stroke="#8A5A2B" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="4" cy="3" r="1" fill="#FDFBF7" fillOpacity="0.5" />
    </svg>
  )
}

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
        className="relative h-9 w-full pointer-events-none"
        style={{ backgroundImage: CORDE_TILE, backgroundRepeat: 'repeat-x', backgroundSize: '240px 36px' }}
      >
        {/* Clous : la corde est épinglée au mur aux deux bords du conteneur */}
        <Clou gauche />
        <Clou gauche={false} />
      </div>
      {/* Les polaroïds commencent sous la bande ; les épingles remontent dedans */}
      <div className="flex flex-wrap gap-6 justify-center -mt-2">{children}</div>
    </div>
  )
}
