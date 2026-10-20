/**
 * Helpers de chemins : sur GitHub Pages l'app est servie sous un sous-chemin
 * (/vibe-coding-platform/), il faut donc préfixer les liens absolus générés
 * côté client (invitations, réinitialisation de mot de passe).
 */

/** Base path de l'app, sans slash final (ex: '/vibe-coding-platform' ou '') */
export const APP_BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '')

/** Construit une URL absolue correcte pour l'app déployée */
export function appUrl(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`
  return `${window.location.origin}${APP_BASE_PATH}${clean}`
}

/** Lien d'invitation complet */
export function invitationLink(token: string): string {
  return appUrl(`/invitation?token=${token}`)
}
