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
export function useComments(recipeId: string | undefined, familyId?: string) {
  const { profile } = useAuth()
  const [comments, setComments] = useState<RecipeComment[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!recipeId) {
      setComments([])
      setLoading(false)
      return
    }
    setLoading(true)
    setComments(await fetchComments(recipeId))
    setLoading(false)
  }, [recipeId])

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
      await refetch()
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

  return { comments, loading, sending, error, refetch, send, remove, edit, commentPhotoUrl: photoPublicUrl }
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
