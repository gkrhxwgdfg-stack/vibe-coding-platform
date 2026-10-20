import type { RecipeCategory } from './types'

export const CATEGORIES: { value: RecipeCategory; label: string; emoji: string }[] = [
  { value: 'entree', label: 'Entrées', emoji: '🥗' },
  { value: 'plat', label: 'Plats', emoji: '🍲' },
  { value: 'dessert', label: 'Desserts', emoji: '🍰' },
  { value: 'fete', label: 'Fêtes', emoji: '🎉' },
  { value: 'saison', label: 'De saison', emoji: '🍂' },
  { value: 'autre', label: 'Autres', emoji: '🫕' },
]

export function categoryMeta(category: string): { label: string; emoji: string } {
  return CATEGORIES.find((c) => c.value === category) ?? { label: 'Autre', emoji: '🫕' }
}

export const STORAGE_BUCKET = 'recipe-photos'

export const APP_NAME = 'Savia'
export const APP_TAGLINE = 'Le savoir qui se transmet à table.'
