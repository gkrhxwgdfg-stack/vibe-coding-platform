import type { Recipe } from './types'

/**
 * Logique du mode cuisson : pas de vue, que du calcul.
 * - ingredientsForStep : surligne les ingrédients concernés par l'étape en cours
 * - parseStepMinutes : trouve une durée en minutes dans le texte de l'étape
 */

/** Normalise une chaîne : minuscules, sans accents, ligatures aplaties (œ -> oe) */
export function accentless(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/Œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/Æ/g, 'ae')
}

// Mots trop génériques d'une ligne d'ingrédient pour la rapprocher d'une étape
const STOP_WORDS = new Set([
  'pincee', 'cas', 'cuillere', 'cuilleres', 'soupe', 'cafe', 'moyen',
  'petit', 'petite', 'petits', 'petites', 'grand', 'grande', 'grandes',
  'gousse', 'gousses', 'tranche', 'tranches', 'botte', 'bottes',
  'brin', 'brins', 'feuille', 'feuilles', 'morceau', 'morceaux',
])

/** Ingrédient actif si l'un de ses mots significatifs apparaît dans l'étape.
 *  On garde aussi les mots courts connus comme noms d'ingrédients
 *  (sel, ail, œuf, riz, lait, vin, miel…) pour ne pas les manquer. */
const KNOWN_SHORT_INGREDIENTS = new Set([
  'sel', 'ail', 'oeuf', 'riz', 'lait', 'vin', 'miel', 'eau', 'farine',
  'beurre', 'sucre', 'pain', 'porc', 'bœuf', 'veau', 'agneau', 'veau',
  'mais', 'soja', 'coco', 'thym', 'basilic', 'persil', 'ciboulette',
])

export function ingredientsForStep(step: string, ingredients: string[]): { line: string; active: boolean }[] {
  const normalizedStep = accentless(step)
  return ingredients.map((line) => {
    const words = accentless(line)
      .split(/[^a-zœ]+/)
      .filter((w) => (w.length > 4 && !STOP_WORDS.has(w)) || KNOWN_SHORT_INGREDIENTS.has(w))
    // Un mot court connu (sel, ail, poivre…) est actif s'il apparaît tel quel
    // ou sous une forme dérivée dans l'étape (sel -> saler, poivre -> poivrer,
    // ail -> aillé, œuf -> oeufs…) : on accepte sa racine de 3 lettres.
    const isActive = words.some((w) => {
      if (normalizedStep.includes(w)) return true
      if (w.length > 4 || !KNOWN_SHORT_INGREDIENTS.has(w)) return false
      // Formes dérivées usuelles : sel -> saler/salé, poivre -> poivrer,
      // ail -> aillé, œuf -> oeufs, lait -> lait...
      const verbRoots: Record<string, string[]> = {
        sel: ['sal'], ail: ['ail'], poivre: ['poivr'],
        oeuf: ['oeuf'], riz: ['riz'], lait: ['lait'], vin: ['vin'],
      }
      const roots = verbRoots[w] ?? [w.slice(0, 3)]
      return roots.some((root) => normalizedStep.includes(root))
    })
    return { line, active: isActive }
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
