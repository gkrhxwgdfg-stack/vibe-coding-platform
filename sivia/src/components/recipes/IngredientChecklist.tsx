import { useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IngredientChecklistProps {
  /** Lignes d'ingrédients (déjà mises à l'échelle des portions) */
  lines: string[]
}

/**
 * Cases à cocher des ingrédients de la fiche recette : cases 24 px, cochée =
 * barre sur le texte (scaleX, 150 ms), ligne en encre-soft.
 * L'état est local à la visite (pas persisté — la liste de courses reste
 * sur papier, comme à la maison).
 */
export function IngredientChecklist({ lines }: IngredientChecklistProps) {
  const [checked, setChecked] = useState<ReadonlySet<number>>(new Set())

  function toggle(index: number) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  return (
    <ul className="space-y-2">
      {lines.map((line, i) => {
        const isChecked = checked.has(i)
        return (
          <li key={i}>
            <button
              type="button"
              onClick={() => toggle(i)}
              aria-pressed={isChecked}
              className="flex items-start gap-3 w-full text-left min-h-11 -my-1 py-1 rounded-lg"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'mt-1.5 w-6 h-6 rounded-md border-2 shrink-0 inline-flex items-center justify-center transition-colors',
                  isChecked ? 'bg-terra border-terra text-creme' : 'border-encre/30 bg-creme',
                )}
              >
                {isChecked && <Check size={16} strokeWidth={3} />}
              </span>
              <span className="relative text-lg">
                <span
                  className={cn(
                    'inline-block transition-colors',
                    isChecked ? 'text-encre-soft' : 'text-encre',
                  )}
                >
                  {line}
                </span>
                {/* Barre qui barre le texte quand cochée */}
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute left-0 top-1/2 h-[2px] w-full bg-encre-soft rounded-full origin-left transition-transform',
                    isChecked ? 'scale-x-100' : 'scale-x-0',
                  )}
                  style={{ transitionDuration: '150ms', transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
                />
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
