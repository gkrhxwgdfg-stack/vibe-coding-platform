import type { Recipe } from './types'

/**
 * Logique du mode cuisson : pas de vue, que du calcul.
 * - ingredientsForStep : surligne les ingrédients concernés par l'étape en cours
 * - parseStepMinutes : trouve une durée en minutes dans le texte de l'étape
 */

/** Normalise une chaîne : minuscules, sans accents */
export function accentless(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

// Mots trop génériques d'une ligne d'ingrédient pour la rapprocher d'une étape
const STOP_WORDS = new Set([
  'pincee', 'cas', 'cuillere', 'cuilleres', 'soupe', 'cafe', 'moyen',
  'petit', 'petite', 'petits', 'petites', 'grand', 'grande', 'grandes',
  'gousse', 'gousses', 'tranche', 'tranches', 'botte', 'bottes',
  'brin', 'brins', 'feuille', 'feuilles', 'morceau', 'morceaux',
])

/** Ingrédient actif si l'un de ses mots significatifs apparaît dans l'étape */
export function ingredientsForStep(step: string, ingredients: string[]): { line: string; active: boolean }[] {
  const normalizedStep = accentless(step)
  return ingredients.map((line) => {
    const words = accentless(line)
      .split(/[^a-z]+/)
      .filter((w) => w.length > 4 && !STOP_WORDS.has(w))
    return { line, active: words.some((w) => normalizedStep.includes(w)) }
  })
}

/** « Laisser cuire 20 min » -> 20 (première durée trouvée, sinon null) */
export function parseStepMinutes(step: string): number | null {
  const hours = accentless(step).match(/(\d+)\s*(?:h|heures?)\b/)
  if (hours) return Number(hours[1]) * 60
  const minutes = step.match(/(\d+)\s*(?:min|minutes?|mn)\b/i)
  if (minutes) return Number(minutes[1])
  return null
}

/** Pour la page cuisson : étape en cours avec son contexte (durée, ingrédients) */
export function cookingStep(recipe: Recipe, index: number) {
  const step = recipe.steps[index]
  return {
    step,
    minutes: parseStepMinutes(step),
    ingredients: ingredientsForStep(step, recipe.ingredients),
  }
}
