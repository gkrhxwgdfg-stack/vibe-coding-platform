import { cn } from '@/lib/utils'

type MietteHumeur = 'sourit' | 'dodo' | 'etonne' | 'fier'

interface MietteProps {
  /** Largeur en px (hauteur déduite du viewBox 80×96). */
  size?: number
  mood?: MietteHumeur
  className?: string
  /** Description pour les lecteurs d'écran ; omis = décorative. */
  label?: string
}

/**
 * Miette — la mascotte de Sivia : un petit épi de blé de la maison Farine & Blé.
 * L'épi est l'unique symbole patrimonial du carnet (§4 du dossier design) ; Miette
 * en est la version incarnée, compagne des vides et des réussites. Le trait reste
 * fin (cannelle), les joues tomate : jamais de grande masse de couleur.
 * Balancement très doux (comme un épi dans le champ), coupé par
 * prefers-reduced-motion.
 */
export function Miette({ size = 64, mood = 'sourit', className, label }: MietteProps) {
  return (
    <svg
      viewBox="0 0 80 96"
      width={size}
      height={Math.round((size * 96) / 80)}
      className={cn('miette', className)}
      role={label ? 'img' : undefined}
      aria-hidden={label ? undefined : true}
      aria-label={label}
    >
      {/* Tige — le fil qui tient Miette debout */}
      <path
        d="M40 66 C 40 78, 36 86, 28 91"
        fill="none"
        stroke="var(--sivia-ble)"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      {/* Petite feuille sur la tige */}
      <path
        d="M38 78 C 30 76, 24 79, 21 85 C 28 87, 35 84, 38 78 Z"
        fill="var(--sivia-vert-clair)"
        stroke="var(--sivia-ble)"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {/* Grains latéraux (l'épi est fait de plusieurs grains) */}
      <path
        d="M25 38 C 29 36, 32 40, 31 46 C 30 51, 25 52, 23 48 C 21 43, 21 39, 25 38 Z"
        fill="var(--sivia-carte)"
        stroke="var(--sivia-ble)"
        strokeWidth={1.6}
      />
      <path
        d="M55 38 C 59 36, 60 41, 59 46 C 58 51, 53 52, 51 47 C 49 42, 51 39, 55 38 Z"
        fill="var(--sivia-carte)"
        stroke="var(--sivia-ble)"
        strokeWidth={1.6}
      />
      {/* Grain central : le corps */}
      <path
        d="M40 14 C 53 16, 58 30, 56 43 C 54 56, 48 63, 40 63 C 32 63, 26 56, 24 43 C 22 30, 27 16, 40 14 Z"
        fill="var(--sivia-carte)"
        stroke="var(--sivia-ble)"
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
      {/* Barbes de l'épi : trois poils gaiement dressés */}
      <g stroke="var(--sivia-ble)" strokeWidth={1.6} strokeLinecap="round">
        <path d="M29 15 C 26 11, 25 8, 26 4" />
        <path d="M40 12 C 40 8, 40.5 5, 40 2" />
        <path d="M51 15 C 54 11, 55 8, 54 4" />
      </g>

      {/* Le visage, selon l'humeur */}
      {mood === 'sourit' && (
        <g>
          <circle cx={33} cy={36} r={2} fill="var(--sivia-encre)" />
          <circle cx={47} cy={36} r={2} fill="var(--sivia-encre)" />
          <path
            d="M33 45 C 36 48.5, 44 48.5, 47 45"
            fill="none"
            stroke="var(--sivia-encre)"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </g>
      )}
      {mood === 'dodo' && (
        <g>
          <path d="M30 36 C 31 38, 35 38, 36 36" fill="none" stroke="var(--sivia-encre)" strokeWidth={2} strokeLinecap="round" />
          <path d="M44 36 C 45 38, 49 38, 50 36" fill="none" stroke="var(--sivia-encre)" strokeWidth={2} strokeLinecap="round" />
          <circle cx={40} cy={46} r={2.4} fill="var(--sivia-encre)" />
          {/* deux petits z qui s'envolent */}
          <path d="M57 20 L 63 20 L 57 26 L 63 26" fill="none" stroke="var(--sivia-ble)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M64 12 L 68 12 L 64 16 L 68 16" fill="none" stroke="var(--sivia-ble)" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      {mood === 'etonne' && (
        <g>
          <circle cx={33} cy={35} r={2.4} fill="var(--sivia-encre)" />
          <circle cx={47} cy={35} r={2.4} fill="var(--sivia-encre)" />
          <circle cx={40} cy={46} r={3} fill="none" stroke="var(--sivia-encre)" strokeWidth={2} />
        </g>
      )}
      {mood === 'fier' && (
        <g>
          <path d="M30 36 C 31 38, 35 38, 36 36" fill="none" stroke="var(--sivia-encre)" strokeWidth={2} strokeLinecap="round" />
          <circle cx={47} cy={36} r={2} fill="var(--sivia-encre)" />
          <path
            d="M34 46 C 37 50, 44 49.5, 46 46.5"
            fill="none"
            stroke="var(--sivia-encre)"
            strokeWidth={2}
            strokeLinecap="round"
          />
          {/* une petite étoile de fierté */}
          <path d="M62 20 C 60 20, 62 17, 63 19 C 64 17, 66 20, 64 20 C 66 21, 63 22, 63 20.5 C 63 22, 60 21, 62 20 Z" fill="var(--sivia-ble)" />
        </g>
      )}

      {/* Joues tomate : une touche d'émotion, jamais une masse */}
      <circle cx={29} cy={43} r={2.2} fill="var(--sivia-tomate)" opacity={0.35} />
      <circle cx={51} cy={43} r={2.2} fill="var(--sivia-tomate)" opacity={0.35} />
    </svg>
  )
}
