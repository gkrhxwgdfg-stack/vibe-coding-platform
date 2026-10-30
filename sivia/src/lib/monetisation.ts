/**
 * Sivia Famille — Phase 1 monétisation (au nom du groupe, jamais de la personne).
 *
 * Règles (spécification « Sivia — Architecture monétisation ») :
 *  - contribuer, consulter, se souvenir : toujours gratuit ;
 *  - le payant verrouille la CONSERVATION : PDF sans filigrane, impression,
 *    livre de famille — le patrimoine reste lisible même sans abonnement ;
 *  - un seul paieur par groupe ; le prix est présenté par personne ;
 *  - le paywall n'apparaît qu'aux moments de fierté, jamais au milieu
 *    d'une saisie ; les apparitions automatiques sont plafonnées à
 *    une par semaine et coupables 6 mois sur demande (« nous rappeler »).
 */

export type FamilyPlan = 'gratuit' | 'essai' | 'actif' | 'expire'
export type PlanSource = 'essai' | 'paiement' | 'cadeau'

/** État du plan d'une famille (colonnes de `families`) */
export interface PlanInfo {
  plan: FamilyPlan
  plan_started_at: string | null
  plan_expires_at: string | null
  plan_source: PlanSource | null
}

/** Tarifs Sivia Famille — un seul plan, deux durées. */
export const PRIX = {
  /** Mensuel sans engagement */
  mensuel: 2.99,
  /** Annuel pré-coché (≈ 2,08 €/mois, −30 %) */
  annuel: 24.99,
  /** Chèque-livre inclus dans l'annuel (crédit sur le livre imprimé) */
  chequeLivre: 15,
  /** Prix public du livre imprimé (impression à la demande) */
  livreImprime: 39,
} as const

/** 24.99 → « 24,99 € » */
export function eur(valeur: number): string {
  return valeur.toFixed(2).replace('.', ',') + ' €'
}

/** Prix par personne : le cadrage tarif du groupe (ex. « 4,17 € par personne »). */
export function prixParPersonne(membres: number): string {
  const n = membres > 1 ? membres : 1
  return eur(PRIX.annuel / n)
}

/** Le groupe a-t-il accès aux fonctions de conservation (essai ou actif, non expiré) ? */
export function planActif(info: PlanInfo | null | undefined): boolean {
  if (!info) return false
  if (info.plan !== 'essai' && info.plan !== 'actif') return false
  if (!info.plan_expires_at) return false
  return new Date(info.plan_expires_at).getTime() > Date.now()
}

/** Jusqu'à quand dure le plan actuel, format court (« 12 mars 2026 ») — null si inconnu. */
export function planJusqua(info: PlanInfo | null | undefined): string | null {
  if (!info?.plan_expires_at) return null
  return new Date(info.plan_expires_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/* ------------------------------------------------------------------ */
/* Anti-spam : une sollicitation commerciale automatique max / semaine, */
/* coupée 6 mois par le bouton « Nous rappeler dans 6 mois ».            */
/* Un clic volontaire ouvre toujours le paywall (aucune limite).        */
/* ------------------------------------------------------------------ */

const LS_DERNIERE_APPARITION = 'sivia.paywall.dernier-vu'
const LS_PAUSE = 'sivia.paywall.pause'
const UNE_SEMAINE = 7 * 24 * 3600 * 1000
const SIX_MOIS = 182 * 24 * 3600 * 1000

/** Une apparition automatique du paywall est-elle permise ? */
export function apparitionAutoAutorisee(): boolean {
  try {
    if (pauseActivee()) return false
    const dernier = Number(localStorage.getItem(LS_DERNIERE_APPARITION) ?? '0')
    return Date.now() - dernier > UNE_SEMAINE
  } catch {
    return true
  }
}

/** À appeler quand le paywall s'ouvre (clic ou auto). */
export function marquerPaywallVu(): void {
  try {
    localStorage.setItem(LS_DERNIERE_APPARITION, String(Date.now()))
  } catch {
    /* stockage indisponible : on ne bloque jamais l'utilisateur */
  }
}

/** « Nous rappeler dans 6 mois » — la promesse est tenue. */
export function rappelerDans6Mois(): void {
  try {
    localStorage.setItem(LS_PAUSE, String(Date.now() + SIX_MOIS))
  } catch {
    /* rien */
  }
}

/** Le paywall a-t-il été mis en pause 6 mois ? */
export function pauseActivee(): boolean {
  try {
    const jusquau = Number(localStorage.getItem(LS_PAUSE) ?? '0')
    return Date.now() < jusquau
  } catch {
    return false
  }
}

/* ------------------------------------------------------------------ */
/* Mode aperçu (Profil) : forcer l'affichage « gratuit » ou « Sivia    */
/* Famille » pour comparer les deux versions — sans toucher à         */
/* l'abonnement réel de la famille (le guard SQL l'interdit de toute  */
/* façon). C'est un réglage personnel, stocké sur l'appareil.          */
/* ------------------------------------------------------------------ */

export type SimulationPlan = 'gratuit' | 'premium'

const LS_SIMULATION = 'sivia.plan.simulation'

/** Réglage d'aperçu courant, ou null pour suivre l'abonnement réel. */
export function simulationPlan(): SimulationPlan | null {
  try {
    const v = localStorage.getItem(LS_SIMULATION)
    return v === 'gratuit' || v === 'premium' ? v : null
  } catch {
    return null
  }
}

/** Force l'affichage d'une version ('gratuit' | 'premium') — null = réel. */
export function setSimulationPlan(plan: SimulationPlan | null): void {
  try {
    if (plan) localStorage.setItem(LS_SIMULATION, plan)
    else localStorage.removeItem(LS_SIMULATION)
  } catch {
    /* rien */
  }
}
