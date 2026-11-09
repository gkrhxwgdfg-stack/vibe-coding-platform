import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { addComment, deleteComment, fetchComments, updateComment } from '@/services/comments'
import { photoPublicUrl } from '@/services/recipes'
import type { RecipeComment } from '@/lib/types'

/**
 * Fil de vie d'une recette : commentaires et photos de la famille.
 * Toute la famille peut écrire ; seul l'auteur peut retirer son message.
 */
const PAGE_SIZE = 20

/** Fusion sans doublon, triée du plus ancien au plus récent */
function mergeComments(a: RecipeComment[], b: RecipeComment[]): RecipeComment[] {
  const byId = new Map<string, RecipeComment>()
  for (const c of [...a, ...b]) byId.set(c.id, c)
  return [...byId.values()].sort((x, y) => x.created_at.localeCompare(y.created_at))
}

export function useComments(recipeId: string | undefined, familyId?: string) {
  const { profile } = useAuth()
  const [comments, setComments] = useState<RecipeComment[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [hasOlder, setHasOlder] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /** `silent = true` : rafraîchit sans faire réapparaître le chargement
   *  (après un envoi : la liste se met à jour sur place, la page ne bouge pas). */
  const refetch = useCallback(async (silent = false) => {
    if (!recipeId) {
      setComments([])
      setHasOlder(false)
      setLoading(false)
      return
    }
    if (!silent) setLoading(true)
    const page = await fetchComments(recipeId, { limit: PAGE_SIZE })
    setComments(page.items)
    setHasOlder(page.hasMore)
    setLoading(false)
  }, [recipeId])

  /** Charge la page de messages plus anciens et les place au début du fil */
  const loadOlder = useCallback(async () => {
    if (!recipeId || loadingOlder) return
    const oldest = comments[0]?.created_at
    if (!oldest) return
    setLoadingOlder(true)
    const page = await fetchComments(recipeId, { before: oldest, limit: PAGE_SIZE })
    setComments((prev) => mergeComments(prev, page.items))
    setHasOlder(page.hasMore)
    setLoadingOlder(false)
  }, [recipeId, comments, loadingOlder])

  useEffect(() => {
    refetch()
  }, [refetch])

  const send = useCallback(
    async (body: string, photoFile: File | null) => {
      if (!recipeId || !profile?.family_id || !familyId) {
        return { error: 'Reconnecte-toi pour participer.' }
      }
      setSending(true)
      setError(null)
      const { error: sendError } = await addComment(recipeId, familyId, profile.id, body, photoFile)
      setSending(false)
      if (sendError) {
        setError(sendError)
        return { error: sendError }
      }
      // Fusion de la dernière page avec les messages déjà chargés : les
      // vieux messages déjà sortis par « voir plus anciens » restent affichés.
      const page = await fetchComments(recipeId, { limit: PAGE_SIZE })
      setComments((prev) => mergeComments(prev, page.items))
      setHasOlder((prev) => prev || page.hasMore)
      return { error: null }
    },
    [recipeId, profile, familyId, refetch],
  )

  const remove = useCallback(
    async (commentId: string) => {
      const { error: deleteError } = await deleteComment(commentId)
      if (deleteError) {
        setError(deleteError)
        return
      }
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    },
    [],
  )

  const edit = useCallback(
    async (commentId: string, body: string) => {
      const { error: updateError } = await updateComment(commentId, body)
      if (updateError) {
        setError(updateError)
        return { error: updateError }
      }
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, body: body.trim() ? body.trim() : null } : c)),
      )
      return { error: null }
    },
    [],
  )

  return { comments, loading, loadingOlder, hasOlder, loadOlder, sending, error, refetch, send, remove, edit, commentPhotoUrl: photoPublicUrl }
}

/** Derniers commentaires de la famille, tous confondus (pour les notifications d'accueil) */
export function useRecentComments(limit = 5) {
  const { profile } = useAuth()
  const [items, setItems] = useState<(RecipeComment & { recipeTitle?: string })[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRecent = useCallback(async () => {
    if (!profile?.family_id) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('recipe_comments')
      .select(
        '*, author:profiles!recipe_comments_author_id_fkey(*), recipe:recipes!recipe_comments_recipe_id_fkey!inner(title, family_id)',
      )
      .eq('recipe.family_id', profile.family_id)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error || !data) {
      setItems([])
    } else {
      setItems(
        (data as unknown as (RecipeComment & {
          author: import('@/lib/types').Profile | null
          recipe: { title: string } | null
        })[]).map((row) => ({
          ...row,
          author: row.author ?? undefined,
          recipeTitle: row.recipe?.title ?? undefined,
        })),
      )
    }
    setLoading(false)
  }, [profile?.family_id, limit])

  useEffect(() => {
    fetchRecent()
  }, [fetchRecent])

  return { items, loading, refetch: fetchRecent }
}
