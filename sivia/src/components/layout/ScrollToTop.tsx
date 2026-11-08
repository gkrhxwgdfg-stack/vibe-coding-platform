import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * À chaque changement de PAGE, on remonte tout en haut — instantané,
 * sans animation (c'est un vrai changement de page, pas un défilement).
 *
 * Pourquoi : par défaut, une application monopage garde la position de
 * défilement entre deux pages. Depuis le bas d'une recette, « Écrire une
 * autre recette » affichait donc le bas du formulaire. Ici, tous les
 * boutons et chemins qui changent de page arrivent en haut.
 *
 * Ce qui ne bouge PAS (volontairement) : les actions qui restent sur la
 * page — téléchargements PDF, impression, modales, filtres (paramètres
 * d'URL de même page) — gardent la position de lecture.
 */
export function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    // La page Famille choisit sa propre position d'arrivée : le milieu
    // (FamilyPage s'en occupe une fois son contenu chargé).
    if (pathname.startsWith('/famille')) return
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}
