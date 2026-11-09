import { supabase } from '@/lib/supabase'
import { STORAGE_BUCKET } from '@/lib/constants'
import type { RecipeFormValues } from '@/lib/types'
import type { Database } from '@/lib/database.types'
import { friendlyError } from '@/lib/copy'
import { compressImage, estPhotoValide } from '@/lib/image'

/**
 * Logique métier des recettes : création / mise à jour / photo / scellage.
 * Garde les vues légères : aucun appel Supabase directement dans les pages.
 */

function parseMinutes(value: string): number | null {
  const n = Number.parseInt(value, 10)
  return Number.isNaN(n) || n < 0 ? null : n
}

/** Upload la photo dans le bucket, dossier = family_id. Retourne le chemin. */
async function uploadPhoto(familyId: string, authorId: string, file: File): Promise<string | null> {
  // Garde-fou : fichier non-image ou trop lourd -> refus propre
  if (!estPhotoValide(file)) return null
  // Compression côté navigateur : ~3–5 Mo → ~200–400 Ko. Le carnet familial
  // reste léger et peu coûteux, même rempli pendant 10 ans.
  const blob = await compressImage(file)
  const path = `${familyId}/${authorId}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, blob, {
    contentType: blob.type || 'image/jpeg',
    upsert: false,
  })
  if (error) return null
  return path
}

/** URL publique d'une photo (bucket public) */
export function photoPublicUrl(path: string | null | undefined): string | null {
  if (!path) return null
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function createRecipe(familyId: string, authorId: string, values: RecipeFormValues) {
  let photoPath: string | null = null
  if (values.photoFile) {
    photoPath = await uploadPhoto(familyId, authorId, values.photoFile)
    // Pas de photo perdue en silence : si l'upload échoue, on bloque la
    // création pour que le formulaire affiche l'erreur et permette de réessayer.
    if (!photoPath) return { data: null, error: "La photo n’a pas pu être envoyée (trop lourde ou pas une image). Réessaie ?" }
  }
  let cardPath: string | null = null
  if (values.cardFile) {
    cardPath = await uploadPhoto(familyId, authorId, values.cardFile)
    if (!cardPath) return { data: null, error: "La photo de la carte n’a pas pu être envoyée. Réessaie ?" }
  }

  const payload = {
    family_id: familyId,
    author_id: authorId,
    title: values.title.trim(),
    category: values.category,
    servings: values.servings,
    prep_time: parseMinutes(values.prep_time),
    cook_time: parseMinutes(values.cook_time),
    ingredients: values.ingredients.filter((i) => i.trim() !== ''),
    steps: values.steps.filter((s) => s.trim() !== ''),
    anecdote: values.anecdote.trim() || null,
    origin_story: values.origin_story.trim() || null,
    photo_url: photoPath,
    card_url: cardPath,
  }

  const { data, error } = await supabase.from('recipes').insert(payload).select().single()
  if (error) return { data: null, error: friendlyError(error.message) }
  return { data, error: null }
}

export async function updateRecipe(
  recipeId: string,
  familyId: string,
  authorId: string,
  values: RecipeFormValues & { keepExistingPhoto?: boolean; keepExistingCard?: boolean },
) {
  let photoPath: string | null | undefined
  if (values.photoFile) {
    const uploaded = await uploadPhoto(familyId, authorId, values.photoFile)
    if (uploaded === null) {
      return { data: null, error: "La photo n’a pas pu être envoyée (trop lourde ou pas une image). Réessaie ?" }
    }
    photoPath = uploaded
  } else if (values.keepExistingPhoto === false) {
    photoPath = null
  }
  let cardPath: string | null | undefined
  if (values.cardFile) {
    const uploadedCard = await uploadPhoto(familyId, authorId, values.cardFile)
    if (uploadedCard === null) {
      return { data: null, error: "La photo de la carte n’a pas pu être envoyée. Réessaie ?" }
    }
    cardPath = uploadedCard
  } else if (values.keepExistingCard === false) {
    cardPath = null
  }

  const payload: Database['public']['Tables']['recipes']['Update'] = {
    title: values.title.trim(),
    category: values.category,
    servings: values.servings,
    prep_time: parseMinutes(values.prep_time),
    cook_time: parseMinutes(values.cook_time),
    ingredients: values.ingredients.filter((i) => i.trim() !== ''),
    steps: values.steps.filter((s) => s.trim() !== ''),
    anecdote: values.anecdote.trim() || null,
    origin_story: values.origin_story.trim() || null,
  }
  if (photoPath !== undefined) payload.photo_url = photoPath
  if (cardPath !== undefined) payload.card_url = cardPath

  const { data, error } = await supabase
    .from('recipes')
    .update(payload)
    .eq('id', recipeId)
    .select()
    .single()
  if (error) return { data: null, error: friendlyError(error.message) }
  return { data, error: null }
}

/** Scelle une recette : l'original devient non modifiable (sauf par le créateur) */
export async function sealRecipe(recipeId: string, sealed: boolean) {
  const { error } = await supabase
    .from('recipes')
    .update({ is_sealed: sealed })
    .eq('id', recipeId)
  return { error: error ? friendlyError(error.message) : null }
}

export async function deleteRecipe(recipeId: string) {
  const { error } = await supabase.from('recipes').delete().eq('id', recipeId)
  return { error: error ? friendlyError(error.message) : null }
}

// ---------------------------------------------------------------------------
// « Je l'ai faite ! » — qui a refait la recette, et quand.
// La généalogie du plat : l'écrite par l'un, refaite par les autres.
// ---------------------------------------------------------------------------

export interface RecipeCookEntry {
  id: string
  user_id: string
  cooked_at: string
  cook: {
    display_name: string | null
    family_role: string | null
    avatar_url: string | null
  } | null
}

/** Qui a déjà refait cette recette (plus ancien d'abord) */
export async function fetchCooks(recipeId: string): Promise<RecipeCookEntry[]> {
  const { data, error } = await supabase
    .from('recipe_cooks')
    .select('id, user_id, cooked_at, cook:profiles!recipe_cooks_user_id_fkey(display_name, family_role, avatar_url)')
    .eq('recipe_id', recipeId)
    .order('cooked_at', { ascending: true })
  if (error || !data) return []
  return data as unknown as RecipeCookEntry[]
}

/** « Je l'ai faite ! » — un marqueur par personne et par recette (idempotent :
 *  re-cliquer ne crée rien de plus, grâce à la contrainte unique + DO NOTHING) */
export async function markCooked(recipeId: string, userId: string) {
  const { error } = await supabase
    .from('recipe_cooks')
    .upsert({ recipe_id: recipeId, user_id: userId }, { onConflict: 'recipe_id,user_id', ignoreDuplicates: true })
  return { error: error ? friendlyError(error.message) : null }
}

/** Retire son marqueur « Je l'ai faite » (se rétracter reste possible) */
export async function unmarkCooked(recipeId: string, userId: string) {
  const { error } = await supabase
    .from('recipe_cooks')
    .delete()
    .eq('recipe_id', recipeId)
    .eq('user_id', userId)
  return { error: error ? friendlyError(error.message) : null }
}
