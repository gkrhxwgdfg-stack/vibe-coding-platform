import { supabase } from '@/lib/supabase'

/**
 * Gestion de son compte : export de ses données (RGPD, droit à la
 * portabilité) et suppression définitive (droit à l'effacement).
 */

/** Exporte tout ce que le compte a créé : profil, recettes, messages, favoris. */
export async function exporterMesDonnees(): Promise<{ error: string | null }> {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user
  if (!user) return { error: 'Reconnecte-toi pour exporter tes données.' }

  const [profilRes, recettesRes, messagesRes, favorisRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('recipes').select('*').eq('author_id', user.id),
    supabase.from('recipe_comments').select('*').eq('author_id', user.id),
    supabase.from('favorites').select('recipe_id, created_at').eq('user_id', user.id),
  ])
  if (profilRes.error || recettesRes.error || messagesRes.error || favorisRes.error) {
    return { error: "L'export n'a pas abouti. Réessaie dans un instant." }
  }

  const bundle = {
    exporte_le: new Date().toISOString(),
    format: 'Sivia — export de mes données (droit à la portabilité, RGPD art. 20)',
    profil: profilRes.data ?? null,
    recettes: recettesRes.data ?? [],
    messages: messagesRes.data ?? [],
    favoris: favorisRes.data ?? [],
  }
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'sivia-mes-donnees.json'
  a.click()
  URL.revokeObjectURL(url)
  return { error: null }
}

/**
 * Suppression définitive du compte. L'Edge Function serveur
 * (supabase/functions/delete-account) préserve l'héritage familial
 * (recettes confiées à un autre membre), nettoie les photos, puis
 * efface le compte et les données personnelles.
 */
export async function supprimerMonCompte(): Promise<{ error: string | null }> {
  const { error } = await supabase.functions.invoke('delete-account', { body: {} })
  if (error) {
    return {
      error:
        "La suppression n'a pas abouti pour le moment. Réessaie dans un instant, " +
        'et si ça persiste, écris-nous : nous effacerons ton compte sous 1 mois.',
    }
  }
  return { error: null }
}
