import { supabase } from '@/lib/supabase'
import { STORAGE_BUCKET } from '@/lib/constants'
import type { RecipeComment } from '@/lib/types'

/**
 * Logique m\u00e9tier du fil de vie des recettes : commentaires et photos
 * partag\u00e9es par la famille. Garde les vues l\u00e9g\u00e8res.
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

/** Charge les commentaires d'une recette, du plus ancien au plus r\u00e9cent */
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

/** Ajoute un commentaire (texte seul ou texte + photo) */
export async function addComment(
  recipeId: string,
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
    if (!photoPath) return { error: "La photo n’a pas pu \u00eatre envoy\u00e9e. R\u00e9essaie ?" }
  }
  const { error } = await supabase.from('recipe_comments').insert({
    recipe_id: recipeId,
    author_id: authorId,
    body: text ? text : null,
    photo_url: photoPath,
  })
  return { error: error?.message ?? null }
}

/** Supprime un commentaire (son auteur uniquement, cf. RLS) */
export async function deleteComment(commentId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('recipe_comments').delete().eq('id', commentId)
  return { error: error?.message ?? null }
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
    counts.set(row.recipe_id, (counts.get(row.recipe_id) ?? 0) + 1)
  }
  return counts
}
