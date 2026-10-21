export type AddAction =
  | { kind: 'new-recipe' }
  | { kind: 'planche-photo'; onOpen: () => void }
  | { kind: 'family-member'; onOpen: () => void }

/**
 * Logique du bouton « + » contextuel, hors des vues :
 * - Accueil : photo + commentaire (modal planche)
 * - Recettes (liste) : nouvelle recette
 * - Famille : ajouter un membre à l'arbre
 * - Favoris / Profil / fiches / formulaires : pas de « + »
 */
export function addActionForPath(
  pathname: string,
  openPlancheModal: () => void,
  openMemberModal: () => void,
): AddAction | null {
  if (pathname === '/') return { kind: 'planche-photo', onOpen: openPlancheModal }
  if (pathname === '/recettes') return { kind: 'new-recipe' }
  if (pathname === '/famille') return { kind: 'family-member', onOpen: openMemberModal }
  return null
}
