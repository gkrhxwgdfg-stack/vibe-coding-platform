import { supabase } from '@/lib/supabase'
import { STORAGE_BUCKET } from '@/lib/constants'
import type { RecipeFormValues } from '@/lib/types'
import type { Database } from '@/lib/database.types'
import { friendlyError } from '@/lib/copy'

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
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${familyId}/${authorId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
    contentType: file.type || 'image/jpeg',
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
  }

  const { data, error } = await supabase.from('recipes').insert(payload).select().single()
  if (error) return { data: null, error: friendlyError(error.message) }
  return { data, error: null }
}

export async function updateRecipe(
  recipeId: string,
  familyId: string,
  authorId: string,
  values: RecipeFormValues & { keepExistingPhoto?: boolean },
) {
  let photoPath: string | null | undefined
  if (values.photoFile) {
    photoPath = await uploadPhoto(familyId, authorId, values.photoFile)
  } else if (values.keepExistingPhoto === false) {
    photoPath = null
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
