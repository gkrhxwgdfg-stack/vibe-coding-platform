// ============================================================================
// Sivia — suppression de compte (droit à l'effacement, RGPD art. 17).
//
// Appelée par l'utilisateur depuis la page Profil. Le JWT de l'appelant est
// vérifié à la main ; la fonction tourne en service_role pour :
//   1. préserver l'héritage familial : les recettes, générations, membres de
//      l'arbre et souvenirs créés par ce compte sont confiés à un autre
//      membre de la famille (jamais effacés) ;
//   2. nettoyer le Storage (photos de ses messages, avatar, et photos de
//      recettes s'il ne reste personne pour en hériter) ;
//   3. supprimer le compte (auth.admin.deleteUser) : les cascades SQL
//      (profiles ON DELETE CASCADE) emportent profil, messages, favoris et
//      liste d'attente. Dernier membre = la famille part avec lui.
//
// Déploiement :
//   supabase functions deploy delete-account --project-ref <ref> --no-verify-jwt
//   (le JWT utilisateur est vérifié ci-dessous ; SUPABASE_URL et
//   SUPABASE_SERVICE_ROLE_KEY sont fournis d'office)
// ============================================================================

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function adminClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  })
}

/** photo_url peut être un chemin Storage (messages) ou une URL publique (avatar). */
function cheminStorage(url: string | null | undefined): string | null {
  if (!url) return null
  const marqueur = 'recipe-photos/'
  const i = url.indexOf(marqueur)
  if (i < 0) return null
  return url.slice(i + marqueur.length).split('?')[0]
}

Deno.serve(async (req) => {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'Non authentifié.' }, 401)

  const { data: tokenData, error: tokenError } = await adminClient().auth.getUser(token)
  if (tokenError || !tokenData.user) {
    return json({ error: 'Session expirée : reconnecte-toi.' }, 401)
  }
  const userId = tokenData.user.id
  const admin = adminClient()

  // 1. Le profil et sa famille
  const { data: profile } = await admin
    .from('profiles')
    .select('id, family_id, avatar_url')
    .eq('id', userId)
    .maybeSingle()

  // 2. L'héritier : un autre membre de la famille, le plus ancien
  let heritier: string | null = null
  if (profile?.family_id) {
    const { data: autres } = await admin
      .from('profiles')
      .select('id')
      .eq('family_id', profile.family_id)
      .neq('id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
    heritier = autres?.[0]?.id ?? null
  }

  // 3. Photos Storage à effacer : celles de ses messages, son avatar,
  //    et celles de ses recettes si personne ne peut en hériter.
  const { data: mesMessages } = await admin
    .from('recipe_comments')
    .select('photo_url')
    .eq('author_id', userId)
    .not('photo_url', 'is', null)
  const recettesPhotos = heritier
    ? []
    : (
        await admin.from('recipes').select('photo_url').eq('author_id', userId).not('photo_url', 'is', null)
      ).data ?? []
  const chemins = [
    ...(mesMessages ?? []).map((m) => m.photo_url),
    ...recettesPhotos.map((r) => r.photo_url),
    profile?.avatar_url,
  ]
    .map(cheminStorage)
    .filter((c): c is string => !!c)
  if (chemins.length > 0) await admin.storage.from('recipe-photos').remove(chemins)

  if (heritier) {
    // 4a. L'héritage reste à la famille : recettes, générations, membres de
    //     l'arbre, souvenirs et éventuellement la famille elle-même passent
    //     sous la garde d'un autre membre.
    await admin.from('recipes').update({ author_id: heritier }).eq('author_id', userId)
    await admin.from('family_generations').update({ created_by: heritier }).eq('created_by', userId)
    await admin.from('family_members').update({ created_by: heritier }).eq('created_by', userId)
    await admin.from('family_events').update({ created_by: heritier }).eq('created_by', userId)
    await admin.from('families').update({ created_by: heritier }).eq('created_by', userId)
    await admin.from('invitations').update({ invited_by: heritier }).eq('invited_by', userId)
  } else if (profile?.family_id) {
    // 4b. Dernier membre : la famille et tout son contenu partent avec lui.
    await admin.from('families').delete().eq('id', profile.family_id)
  } else {
    await admin.from('invitations').update({ invited_by: null }).eq('invited_by', userId)
  }

  // 5. Suppression du compte : les cascades SQL emportent le reste.
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId)
  if (deleteError) return json({ error: 'Suppression impossible pour le moment.' }, 500)
  return json({ ok: true })
})
