import { cn } from '@/lib/utils'

interface StampProps {
  /** Pr\u00e9nom du cr\u00e9ateur, ex: \u00ab Recette certifi\u00e9e de la part de Jeanne \u00bb */
  name: string
  className?: string
  /** Rotation en degr\u00e9s */
  rotate?: number
}

/**
 * Tampon d'authenticit\u00e9 : appos\u00e9 sur les recettes \u00ab de la main de \u00bb l'auteur.
 * Cercle tamponn\u00e9 avec le pr\u00e9nom du cr\u00e9ateur \u2014 la trace officielle de la maison.
 */
export function Stamp({ name, className, rotate = -8 }: StampProps) {
  return (
    <span
      className={cn(
        'inline-flex flex-col items-center justify-center text-center select-none',
        'w-24 h-24 rounded-full border-[3px] border-dashed border-carmine text-carmine',
        'font-serif font-bold uppercase leading-tight px-2',
        className,
      )}
      style={{ transform: `rotate(${rotate}deg)` }}
      role="img"
      aria-label={`Tampon d'authenticit\u00e9 : recette de la part de ${name}`}
    >
      <span className="text-[10px] tracking-wider normal-case font-sans font-bold">De la part de</span>
      <span className="text-lg normal-case">{name}</span>
    </span>
  )
}
