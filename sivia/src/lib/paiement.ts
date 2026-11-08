/**
 * Sivia Famille — liens de paiement Stripe (Payment Links).
 *
 * Stripe héberge la page de paiement : aucune donnée carte ne passe par
 * Sivia. Le lien transporte `client_reference_id` = l'id de la famille :
 * c'est ainsi que le webhook (supabase/functions/stripe-webhook) sait
 * quel carnet déverrouiller après le paiement.
 *
 * CONFIGURATION (2 valeurs à coller, l'une des deux méthodes suffit) :
 *  1. Variables d'environnement du build :
 *     VITE_STRIPE_LINK_ANNUEL, VITE_STRIPE_LINK_MENSUEL
 *     (GitHub Settings > Secrets and variables > Actions > Variables,
 *      puis Vercel > Settings > Environment Variables)
 *  2. Ou directement ci-dessous, dans LIENS_DIRECTS.
 *
 * Tant qu'un lien vaut null, le paywall garde le parcours actuel
 * (essai sans carte + liste d'attente). Voir docs/stripe.md.
 */

/** Colle ici tes liens si tu ne veux pas passer par les variables d'env. */
const LIENS_DIRECTS: { annuel: string | null; mensuel: string | null } = {
  annuel: null,
  mensuel: null,
}

function lien(nom: 'annuel' | 'mensuel'): string | null {
  const env = import.meta.env[`VITE_STRIPE_LINK_${nom.toUpperCase()}`] as string | undefined
  return (env?.trim() || LIENS_DIRECTS[nom] || null)
}

/** Les paiements sont-ils ouverts pour cette durée ? */
export function paiementOuvert(duree: 'annuel' | 'mensuel'): boolean {
  return lien(duree) !== null
}

/**
 * Lien de paiement prêt à ouvrir : la famille est passée en référence
 * (client_reference_id) et l'e-mail pré-rempli pour éviter les fautes
 * de frappe. En échec, retourne null (le parcours reste gratuit).
 */
export function lienPaiement(duree: 'annuel' | 'mensuel', familyId: string | null, email?: string | null): string | null {
  const base = lien(duree)
  if (!base) return null
  const params = new URLSearchParams()
  if (familyId) params.set('client_reference_id', familyId)
  if (email) params.set('prefilled_email', email)
  const q = params.toString()
  return q ? `${base}?${q}` : base
}
