import { supabase } from '@/lib/supabase'
import { friendlyError } from '@/lib/copy'
import { STORAGE_BUCKET } from '@/lib/constants'
import type { RecipeComment } from '@/lib/types'

/**
 * Logique métier du fil de vie des recettes : commentaires et photos
 * partagées par la famille. Garde les vues légères.
 */

type CommentRow = RecipeComment & { author: import('@/lib/types').Profile | null }

/** Upload d'une photo de commentaire, dossier = family_id. Retourne le chemin. */
async function uploadCommentPhoto(familyId: string, authorId: string, file: File): Promise<string | null> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${familyId}/comments/${authorId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
    contentType: file.type || 'image/jpeg',
    upsert: false,
  })
  if (error) return null
  return path
}

/** Charge les commentaires d'une recette, du plus ancien au plus récent */
export async function fetchComments(recipeId: string): Promise<RecipeComment[]> {
  const { data, error } = await supabase
    .from('recipe_comments')
    .select('*, author:profiles!recipe_comments_author_id_fkey(*)')
    .eq('recipe_id', recipeId)
    .order('created_at', { ascending: true })
  if (error || !data) return []
  return (data as unknown as CommentRow[]).map((row) => ({
    ...row,
    author: row.author ?? undefined,
  }))
}

/** Charge les moments de la planche familiale (commentaires sans recette) */
export async function fetchPlancheComments(familyId: string): Promise<RecipeComment[]> {
  const { data, error } = await supabase
    .from('recipe_comments')
    .select('*, author:profiles!recipe_comments_author_id_fkey(*)')
    .eq('family_id', familyId)
    .is('recipe_id', null)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return (data as unknown as CommentRow[]).map((row) => ({
    ...row,
    author: row.author ?? undefined,
  }))
}

/** Ajoute un commentaire (texte seul ou texte + photo).
 *  recipeId = null -> moment de la planche familiale (rattaché à la famille). */
export async function addComment(
  recipeId: string | null,
  familyId: string,
  authorId: string,
  body: string,
  photoFile: File | null,
): Promise<{ error: string | null }> {
  const text = body.trim()
  if (!text && !photoFile) {
    return { error: 'Il faut un mot, ou une photo, ou les deux.' }
  }
  let photoPath: string | null = null
  if (photoFile) {
    photoPath = await uploadCommentPhoto(familyId, authorId, photoFile)
    if (!photoPath) return { error: "La photo n’a pas pu être envoyée. Réessaie ?" }
  }
  const { error } = await supabase.from('recipe_comments').insert({
    recipe_id: recipeId,
    family_id: familyId,
    author_id: authorId,
    body: text ? text : null,
    photo_url: photoPath,
  })
  return { error: error ? friendlyError(error.message) : null }
}

/** Modifie le texte d'un commentaire (son auteur uniquement, cf. RLS) */
export async function updateComment(
  commentId: string,
  body: string,
): Promise<{ error: string | null }> {
  const text = body.trim()
  const { error } = await supabase
    .from('recipe_comments')
    .update({ body: text ? text : null })
    .eq('id', commentId)
  return { error: error ? friendlyError(error.message) : null }
}

/** Supprime un commentaire (son auteur uniquement, cf. RLS) */
export async function deleteComment(commentId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('recipe_comments').delete().eq('id', commentId)
  return { error: error ? friendlyError(error.message) : null }
}

/** Compte les commentaires d'une recette (pour les notifications d'accueil) */
export async function countComments(recipeIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  if (recipeIds.length === 0) return counts
  const { data, error } = await supabase
    .from('recipe_comments')
    .select('recipe_id')
    .in('recipe_id', recipeIds)
  if (error || !data) return counts
  for (const row of data) {
    if (row.recipe_id) counts.set(row.recipe_id, (counts.get(row.recipe_id) ?? 0) + 1)
  }
  return counts
}
