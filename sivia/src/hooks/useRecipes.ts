import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { Profile, Recipe, RecipeFilters, RecipeWithMeta } from '@/lib/types'

interface UseRecipesResult {
  recipes: RecipeWithMeta[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

type RecipeRow = Recipe & { author: Profile | null }

/**
 * Charge les recettes de la famille de l'utilisateur courant,
 * avec le profil de l'auteur et l'état favori de l'utilisateur.
 */
export function useRecipes(filters: RecipeFilters): UseRecipesResult {
  const { profile, user } = useAuth()
  const [recipes, setRecipes] = useState<RecipeWithMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const familyId = profile?.family_id

  const fetchRecipes = useCallback(async () => {
    if (!familyId || !user) {
      setRecipes([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    let query = supabase
      .from('recipes')
      .select('*, author:profiles!recipes_author_id_fkey(*)')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false })

    if (filters.category !== 'toutes') {
      query = query.eq('category', filters.category)
    }
    if (filters.authorId !== 'tous') {
      query = query.eq('author_id', filters.authorId)
    }
    if (filters.query.trim()) {
      query = query.ilike('title', `%${filters.query.trim()}%`)
    }

    const { data, error: fetchError } = await query
    if (fetchError) {
      setError(fetchError.message)
      setRecipes([])
      setLoading(false)
      return
    }

    const rows = (data ?? []) as unknown as RecipeRow[]

    // Favoris de l'utilisateur pour ces recettes
    const ids = rows.map((r) => r.id)
    const { data: favRows } = await supabase
      .from('favorites')
      .select('recipe_id')
      .eq('user_id', user.id)
      .in('recipe_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])

    const favSet = new Set((favRows ?? []).map((f) => f.recipe_id))

    // Recherche plein texte côté client sur anecdotes et étapes aussi
    const q = filters.query.trim().toLowerCase()
    const enriched: RecipeWithMeta[] = rows.map((row) => ({
      ...row,
      author: row.author ?? undefined,
      is_favorite: favSet.has(row.id),
    }))

    setRecipes(q ? enriched.filter((r) => matchesFullText(r, q)) : enriched)
    setLoading(false)
  }, [familyId, user, filters.category, filters.authorId, filters.query])

  useEffect(() => {
    fetchRecipes()
  }, [fetchRecipes])

  return { recipes, loading, error, refetch: fetchRecipes }
}

function matchesFullText(recipe: Recipe, q: string): boolean {
  const haystack = [
    recipe.title,
    recipe.anecdote ?? '',
    recipe.origin_story ?? '',
    ...recipe.ingredients,
    ...recipe.steps,
  ]
    .join(' ')
    .toLowerCase()
  return haystack.includes(q)
}

/** Charge une recette unique avec son auteur et l'état favori */
export function useRecipe(recipeId: string | undefined) {
  const { user } = useAuth()
  const [recipe, setRecipe] = useState<RecipeWithMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRecipe = useCallback(async () => {
    if (!recipeId || !user) {
      setRecipe(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('recipes')
      .select('*, author:profiles!recipes_author_id_fkey(*)')
      .eq('id', recipeId)
      .maybeSingle()

    if (fetchError || !data) {
      setError(fetchError?.message ?? 'Recette introuvable')
      setRecipe(null)
      setLoading(false)
      return
    }

    const row = data as unknown as RecipeRow
    const { data: fav } = await supabase
      .from('favorites')
      .select('recipe_id')
      .eq('user_id', user.id)
      .eq('recipe_id', recipeId)
      .maybeSingle()

    setRecipe({ ...row, author: row.author ?? undefined, is_favorite: !!fav })
    setLoading(false)
  }, [recipeId, user])

  useEffect(() => {
    fetchRecipe()
  }, [fetchRecipe])

  return {
    recipe,
    loading,
    error,
    refetch: fetchRecipe,
    setRecipe: setRecipe as (next: RecipeWithMeta) => void,
  }
}

/** Bascule le favori d'une recette */
export function useToggleFavorite() {
  const { user } = useAuth()
  return useCallback(
    async (recipeId: string, isFavorite: boolean) => {
      if (!user) return { error: 'Non connecté' }
      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('recipe_id', recipeId)
        return { error: error?.message ?? null }
      }
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, recipe_id: recipeId })
      return { error: error?.message ?? null }
    },
    [user],
  )
}
