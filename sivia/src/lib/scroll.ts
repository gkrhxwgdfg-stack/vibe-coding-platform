/**
 * Position d'arrivée des boutons « Aperçu du carnet » et « Découvrir
 * Sivia Famille » : le MILIEU de la page — les informations restent
 * visibles derrière le flou de la modale, sans traverser le haut
 * de page. Instantané : une animation serait coupée par l'ouverture
 * de la modale et s'arrêterait en cours de route.
 */
export function scrollVersMilieu() {
  const doc = document.documentElement
  const middle = Math.max(0, (doc.scrollHeight - window.innerHeight) / 2)
  window.scrollTo({ top: middle })
}
