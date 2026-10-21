import { cn } from '@/lib/utils'

interface StampProps {
  /** Prénom du créateur, ex: « Recette certifiée de la part de Jeanne » */
  name: string
  className?: string
  /** Rotation en degrés */
  rotate?: number
}

/**
 * Tampon d'authenticité : apposé sur les recettes « de la main de » l'auteur.
 * Cercle tamponné avec le prénom du créateur — la trace officielle de la maison.
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
      aria-label={`Tampon d'authenticité : recette de la part de ${name}`}
    >
      <span className="text-[10px] tracking-wider normal-case font-sans font-bold">De la part de</span>
      <span className="text-lg normal-case">{name}</span>
    </span>
  )
}
