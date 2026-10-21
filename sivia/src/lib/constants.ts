import type { RecipeCategory } from './types'

export const CATEGORIES: { value: RecipeCategory; label: string }[] = [
  { value: 'entree', label: 'Entrées' },
  { value: 'plat', label: 'Plats' },
  { value: 'dessert', label: 'Desserts' },
  { value: 'fete', label: 'Fêtes' },
  { value: 'saison', label: 'De saison' },
  { value: 'autre', label: 'Autres' },
]

export function categoryMeta(category: string): { label: string } {
  return CATEGORIES.find((c) => c.value === category) ?? { label: 'Autre' }
}

export const STORAGE_BUCKET = 'recipe-photos'

export const APP_NAME = 'Savia'
export const APP_TAGLINE = 'Le savoir qui se transmet à table.'
