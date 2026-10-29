/**
 * Persistance du mode cuisson dans localStorage : étape courante, minuteurs
 * libellés, reprise après verrouillage de l'écran. Réconciliation d'horloge :
 * les minuteurs sont stockés avec leur timestamp de fin (pas leur temps
 * restant), donc une mise en veille de 10 min ne les fait pas « sauter ».
 */

export interface TimerState {
  id: string
  label: string
  /** Timestamp (ms) de fin — null si en pause */
  endsAt: number | null
  /** Secondes restantes quand mis en pause */
  remainingWhenPaused: number | null
}

export interface CookingSessionState {
  recipeId: string
  stepIndex: number
  /** Étape atteinte (pour la barre de progression « 3/8 ») */
  timers: TimerState[]
  /** Indices des étapes déjà rayées (checklist du mode cuisson) */
  doneSteps?: number[]
  updatedAt: number
}

const PREFIX = 'savia-cooking-'

function key(recipeId: string): string {
  return PREFIX + recipeId
}

/** Charge l'état persisté d'une recette (null si absent ou invalide) */
export function loadCookingSession(recipeId: string): CookingSessionState | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(key(recipeId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as CookingSessionState
    if (parsed.recipeId !== recipeId || typeof parsed.stepIndex !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

/** Persiste l'état (étape + minuteurs) */
export function saveCookingSession(state: CookingSessionState): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(key(state.recipeId), JSON.stringify({ ...state, updatedAt: Date.now() }))
  } catch {
    // quota dépassé ou mode privé : la cuisson continue sans persistance
  }
}

/** Supprime l'état persisté (sortie propre de la cuisson) */
export function clearCookingSession(recipeId: string): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(key(recipeId))
  } catch {
    // idem
  }
}

/**
 * Réconciliation d'horloge : pour un minuteur en cours, renvoie les secondes
 * restantes réelles (peut être 0 si le temps est écoulé pendant la veille).
 * Pour un minuteur en pause, renvoie le temps figé.
 */
export function reconcileTimer(timer: TimerState, now = Date.now()): number {
  if (timer.endsAt === null) return timer.remainingWhenPaused ?? 0
  return Math.max(0, Math.round((timer.endsAt - now) / 1000))
}

/** Crée un minuteur libellé à partir d'une durée en minutes */
export function createTimer(label: string, minutes: number, now = Date.now()): TimerState {
  return {
    id: crypto.randomUUID(),
    label,
    endsAt: now + Math.round(minutes * 60 * 1000),
    remainingWhenPaused: null,
  }
}
