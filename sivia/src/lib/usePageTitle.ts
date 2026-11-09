import { useEffect } from 'react'
import { APP_NAME } from '@/lib/constants'

const SITE_TAGLINE = 'Recettes de famille'

/**
 * Titre d'onglet par page — détail de finition : l'onglet du navigateur,
 * l'historique et les favoris disent toujours où l'on se trouve
 * (« Mes favoris — Sivia », « Crêpes de mamie — Sivia ») au lieu du titre
 * statique du site sur toutes les pages.
 * Sans argument : titre complet du site (accueil).
 */
export function usePageTitle(pageTitle?: string) {
  useEffect(() => {
    document.title = pageTitle ? `${pageTitle} — ${APP_NAME}` : `${APP_NAME} — ${SITE_TAGLINE}`
  }, [pageTitle])
}
