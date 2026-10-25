import { cn } from '@/lib/utils'
import { useReadingSize } from '@/hooks/useReadingSize'
import {
  READING_SIZES,
  readingSizeLabel,
  type ReadingSize,
} from '@/lib/readingSize'

interface ReadingSizePickerProps {
  /** Libellé du groupe (affiché au-dessus) */
  label?: string
  /** Description affichée sous le groupe */
  hint?: string
}

/**
 * Réglage « Taille du texte » (chantier 8) : Standard / Grande / Très grande.
 * Groupe de boutons radio natifs : ordre de tabulation cohérent, état lu par
 * les lecteurs d'écran (role radiogroup + aria-checked via les inputs).
 */
export function ReadingSizePicker({ label = 'Taille du texte', hint }: ReadingSizePickerProps) {
  const { size, setSize } = useReadingSize()

  return (
    <fieldset role="radiogroup" aria-label={label}>
      <legend className="block font-bold text-encre mb-1.5">{label}</legend>
      {hint && <p className="text-sm text-encre-soft mb-2">{hint}</p>}
      <div className="grid grid-cols-3 gap-2">
        {READING_SIZES.map((option: ReadingSize) => {
          const selected = size === option
          return (
            <label
              key={option}
              className={cn(
                'touch-target-lg flex min-h-12 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 px-2 py-2 text-center transition-colors',
                selected
                  ? 'border-terra-dark bg-terra-dark text-creme'
                  : 'border-encre/25 bg-creme text-encre hover:border-terra',
              )}
            >
              <input
                type="radio"
                name="reading-size"
                value={option}
                checked={selected}
                onChange={() => setSize(option)}
                className="sr-only"
              />
              <span aria-hidden="true" className="text-lg font-serif font-bold leading-none">
                A{option === 'standard' ? '' : option === 'lg' ? '+' : '++'}
              </span>
              <span className="mt-1 text-xs font-bold">{readingSizeLabel(option)}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
