import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PolaroidProps {
  src?: string | null
  caption: ReactNode
  /** Décalage/rotation du polaroid posé, ex: -3 */
  tilt?: number
  className?: string
  /** Contenu optionnel superposé sur la photo (badge, etc.) */
  overlay?: ReactNode
}

/** Photo « polaroid » posée en biais avec un mot dessous. Taille fixe, ne grandit pas. */
export function Polaroid({ src, caption, tilt = -2, className, overlay }: PolaroidProps) {
  return (
    <figure
      className={cn(
        'bg-white p-2.5 pb-3 rounded-md shadow-card inline-block w-[200px] shrink-0',
        'border-b-4 border-brun',
        className,
      )}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-lin">
        {src ? (
          <img src={src} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: '#fbf6ec',
              backgroundImage: [
                'repeating-linear-gradient(0deg, transparent, transparent 22px, rgba(91, 122, 158, 0.3) 22px, rgba(91, 122, 158, 0.3) 25px)',
                'repeating-linear-gradient(90deg, transparent, transparent 22px, rgba(91, 122, 158, 0.3) 22px, rgba(91, 122, 158, 0.3) 25px)',
              ].join(', '),
            }}
            role="img"
            aria-label="Pas de photo"
          />
        )}
        {overlay}
      </div>
      <figcaption className="text-hand text-brun text-2xl text-center pt-2 leading-tight max-h-[7.5rem] overflow-hidden">
        {caption}
      </figcaption>
    </figure>
  )
}
