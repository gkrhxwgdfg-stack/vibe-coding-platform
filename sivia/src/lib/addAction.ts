export type AddAction =
  | { kind: 'new-recipe' }
  | { kind: 'planche-photo'; onOpen: () => void }

/**
 * Logique du bouton « + » contextuel, hors des vues :
 * - Accueil : photo + commentaire (modal planche)
 * - Recettes (liste) : nouvelle recette
 * - Famille : PAS de « + » flottant — l'arbre a ses propres « + » et scotchs
 * - Favoris / Profil / fiches / formulaires : pas de « + »
 */
export function addActionForPath(
  pathname: string,
  openPlancheModal: () => void,
): AddAction | null {
  if (pathname === '/') return { kind: 'planche-photo', onOpen: openPlancheModal }
  if (pathname === '/recettes') return { kind: 'new-recipe' }
  return null
}
