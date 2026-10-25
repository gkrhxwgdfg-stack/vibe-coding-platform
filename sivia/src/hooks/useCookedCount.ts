import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Compte combien de fois une recette a été « cuisinée » : les commentaires
 * du fil de vie qui portent une photo (une photo = une réalisation, un plat
 * sorti du four). La RLS limite déjà la lecture à la famille — on ne touche
 * à rien côté sécurité.
 */
export function useCookedCount(recipeId: string | undefined) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!recipeId) {
      setCount(0)
      return
    }
    let cancelled = false
    supabase
      .from('recipe_comments')
      .select('id, photo_url')
      .eq('recipe_id', recipeId)
      .not('photo_url', 'is', null)
      .then(({ data }) => {
        if (!cancelled) setCount((data ?? []).length)
      })
    return () => {
      cancelled = true
    }
  }, [recipeId])

  return count
}
