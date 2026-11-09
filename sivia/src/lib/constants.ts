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

export const APP_NAME = 'Sivia'
export const APP_TAGLINE = 'Le savoir qui se transmet en cuisine.'
/**
 * Adresse e-mail de contact publique : signalements de contenu (DSA, art. 16),
 * questions juridiques, support. ⚠️ [À COMPLÉTER avant le lancement public] :
 * les boutons « Signaler », le footer et les pages juridiques pointent TOUS ici.
 */
export const CONTACT_EMAIL = '[adresse e-mail de contact à compléter]'
export const APP_BUILD_MARKER = 'v2.0.2-deploy-1793016711'
// v2.0.2 deploy 1793016711
