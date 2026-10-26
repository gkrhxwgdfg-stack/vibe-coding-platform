import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { RecipeForm } from '@/components/recipes/RecipeForm'
import { useRecipe } from '@/hooks/useRecipes'
import { useAuth } from '@/context/AuthContext'
import { createRecipe, updateRecipe } from '@/services/recipes'
import { Spinner } from '@/components/ui/Spinner'
import { COPY } from '@/lib/copy'
import type { RecipeFormValues } from '@/lib/types'

/**
 * Création (/recettes/nouvelle) et édition (/recettes/:id/modifier)
 * partagent le même formulaire.
 */
export function RecipeFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const { recipe, loading } = useRecipe(isEdit ? id : undefined)
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  if (isEdit && loading) return <Spinner label={COPY.loading.recette} />
  if (isEdit && !recipe) {
    navigate('/recettes', { replace: true })
    return null
  }

  async function handleSubmit(values: RecipeFormValues & { keepExistingPhoto?: boolean }) {
    if (!profile?.family_id || !profile.id) return { error: COPY.errors.session }
    setSubmitting(true)
    if (isEdit && recipe) {
      const { error } = await updateRecipe(recipe.id, recipe.family_id, profile.id, values)
      setSubmitting(false)
      if (error) return { error }
      navigate(`/recettes/${recipe.id}`, { replace: true })
      return { error: null }
    }
    const { data, error } = await createRecipe(profile.family_id, profile.id, values)
    setSubmitting(false)
    if (error || !data) return { error: error ?? COPY.errors.generique }
    navigate(`/recettes/${data.id}`, { replace: true })
    return { error: null }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <p className="kicker">Nouvelle recette</p>
      <h1 className="text-3xl font-bold mt-1 mb-1">
        {isEdit ? 'Modifier la recette' : 'Raconte ta recette'}
      </h1>
      <p className="text-hand text-bleu-dark text-2xl mb-6">
        {isEdit ? 'On améliore, on précise, on transmet.' : 'Qui t’a appris ce plat ?'}
      </p>
      <RecipeForm initial={isEdit ? recipe : null} submitting={submitting} onSubmit={handleSubmit} />
    </div>
  )
}
