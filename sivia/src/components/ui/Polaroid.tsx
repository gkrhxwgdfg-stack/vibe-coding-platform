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
      className={cn('polaroid relative inline-block w-[200px] shrink-0', className)}
      style={{ ['--r' as string]: `${tilt}deg` }}
    >
      <span className="epingle" aria-hidden="true" />
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-vert-clair">
        {src ? (
          <img src={src} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: '#ffffff',
              backgroundImage:
                'radial-gradient(rgba(46, 89, 57, 0.16) 1.6px, transparent 1.6px)',
              backgroundSize: '16px 16px',
            }}
            role="img"
            aria-label="Pas de photo"
          />
        )}
        {overlay}
      </div>
      <figcaption className="font-serif italic text-cannelle text-[11.5px] text-center pt-2 leading-snug max-h-[7.5rem] overflow-hidden">
        {caption}
      </figcaption>
    </figure>
  )
}
