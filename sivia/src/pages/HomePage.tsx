import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { Plus } from 'lucide-react'
import { useRecipes } from '@/hooks/useRecipes'
import { useRecentComments } from '@/hooks/useComments'
import { useAuth } from '@/context/AuthContext'
import { fetchPlancheComments } from '@/services/comments'
import { AddPhotoModal } from '@/components/planche/AddPhotoModal'
import { CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { Polaroid } from '@/components/ui/Polaroid'
import { ExpandableText } from '@/components/ui/ExpandableText'
import { photoPublicUrl } from '@/services/recipes'
import { COPY } from '@/lib/copy'
import { MOTION, pickDaily, stableTilt } from '@/lib/motion'
import { CordeALinge } from '@/components/motifs/CordeALinge'
import { PluieFarine } from '@/components/motifs/PluieFarine'
import { Sparkle } from '@/components/motifs/Sparkle'
import { DailyRecipeCard } from '@/components/recipes/DailyRecipeCard'
import type { RecipeComment } from '@/lib/types'

const NO_FILTERS = { query: '', category: 'toutes' as const, authorId: 'tous' as const }

export function HomePage() {
  const { profile, family } = useAuth()
  const { recipes, loading } = useRecipes(NO_FILTERS)
  const { items: recentActivity, loading: activityLoading } = useRecentComments(5)

  // Moments de la planche publiés sans recette (photo + commentaire, famille)
  const [plancheMoments, setPlancheMoments] = useState<RecipeComment[]>([])
  const [plancheLoading, setPlancheLoading] = useState(true)
  const [photoModalOpen, setPhotoModalOpen] = useState(false)

  const refetchPlanche = useCallback(async () => {
    if (!profile?.family_id) {
      setPlancheMoments([])
      setPlancheLoading(false)
      return
    }
    setPlancheLoading(true)
    setPlancheMoments(await fetchPlancheComments(profile.family_id))
    setPlancheLoading(false)
  }, [profile?.family_id])

  useEffect(() => {
    refetchPlanche()
  }, [refetchPlanche])

  // Planche familiale personnalisable : les photos publiées par toute la famille,
  // les moments sans recette, et les derniers contenus (photos, anecdotes)
  // partagés en commentaires de recettes.
  const recentPhotos = recipes.filter((r) => r.photo_url).slice(0, 6)
  const photoComments = recentActivity.filter((c) => c.photo_url && c.recipe_id).slice(0, 6)
  const moments = plancheMoments.filter((c) => c.photo_url).slice(0, 6)
  const plancheEmpty = recentPhotos.length === 0 && photoComments.length === 0 && moments.length === 0
  const isLoading = loading || activityLoading || plancheLoading

  // Sélection stable « plat du dimanche » : graine = AAAAMMJJ, identique toute la journée
  const dailyRecipe = useMemo(
    () => (recipes.length > 1 ? pickDaily(recipes) : recipes[0] ?? null),
    [recipes],
  )

  return (
    <div className="space-y-6">
      {/* Hero : pluie de farine sur le header d'accueil uniquement (§8) */}
      <section aria-labelledby="home-title" className="relative overflow-hidden">
        <PluieFarine />
        <p className="kicker relative">Le carnet de {family?.name ?? 'ta famille'}</p>
        <h1 id="home-title" className="relative font-serif text-4xl font-semibold mt-1">
          Bonjour, {profile?.display_name}
        </h1>
        <p className="relative font-serif italic text-encre-doux text-2xl mt-1">
          Qu’est-ce qu’on cuisine aujourd’hui ?
          <Sparkle className="inline-block ml-2 align-middle" />
        </p>
      </section>

      {/* Le plat du dimanche : choix stable pour la journée (graine AAAAMMJJ) */}
      {dailyRecipe && (
        <section aria-labelledby="daily-title" className="anim-enter">
          <p id="daily-title" className="kicker mb-2">Le plat du dimanche</p>
          <DailyRecipeCard recipe={dailyRecipe} />
        </section>
      )}

      {/* Planche familiale : moments de cuisine partagés (tableau de photos) */}
      <section aria-labelledby="planche-title">
        <div className="flex items-center justify-between mb-3">
          <CardHeader kicker="Planche familiale" title="Moments de cuisine partagés" />
          {/* Le « + » de la planche ouvre le modal photo — jamais le formulaire de recette */}
          <Button onClick={() => setPhotoModalOpen(true)} aria-label="Ajouter une photo à la planche familiale">
            <Plus size={20} aria-hidden="true" /> Ajouter
          </Button>
        </div>
        {isLoading ? (
          <Spinner label={COPY.loading.planche} />
        ) : plancheEmpty ? (
          <EmptyState title="La planche est vide" handText={COPY.empty.planche}>
            <Button size="lg" onClick={() => setPhotoModalOpen(true)}>
              <Plus size={20} aria-hidden="true" /> Accrocher la première photo
            </Button>
          </EmptyState>
        ) : (
          <CordeALinge>
            {recentPhotos.map((recipe, i) => (
              <Link
                key={recipe.id}
                to={`/recettes/${recipe.id}`}
                className="relative block anim-pop"
                style={{
                  animationDelay: `${i * MOTION.staggerPlanche}ms`,
                  transitionDuration: '250ms',
                  transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                <Polaroid
                  src={photoPublicUrl(recipe.photo_url)}
                  caption={`${recipe.title} — ${recipe.author?.display_name ?? ''}`}
                  tilt={stableTilt(recipe.id)}
                />
              </Link>
            ))}
            {photoComments.map((comment, i) => (
              <Link
                key={comment.id}
                to={`/recettes/${comment.recipe_id}`}
                className="relative block anim-pop"
                style={{
                  animationDelay: `${(recentPhotos.length + i) * MOTION.staggerPlanche}ms`,
                  transitionDuration: '250ms',
                  transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                <Polaroid
                  src={photoPublicUrl(comment.photo_url)}
                  caption={
                    <span className="block">
                      {comment.body ? (
                        <span className="block text-encre text-base leading-snug mb-0.5">
                          « <ExpandableText text={comment.body} maxLength={70} /> »
                        </span>
                      ) : null}
                      <span className="block">
                        {comment.author?.display_name ?? ''}
                        {comment.recipeTitle ? ` · ${comment.recipeTitle}` : ''}
                      </span>
                    </span>
                  }
                  tilt={stableTilt(comment.id)}
                />
              </Link>
            ))}
            {moments.map((comment, i) => (
              <div
                key={comment.id}
                className="relative inline-block anim-pop"
                style={{ animationDelay: `${(recentPhotos.length + photoComments.length + i) * MOTION.staggerPlanche}ms` }}
              >
                <Polaroid
                  src={photoPublicUrl(comment.photo_url)}
                  caption={
                    <span className="block">
                      {comment.body ? (
                        <span className="block text-encre text-base leading-snug mb-0.5">
                          « <ExpandableText text={comment.body} maxLength={70} /> »
                        </span>
                      ) : null}
                      <span className="block">{comment.author?.display_name ?? ''}</span>
                    </span>
                  }
                  tilt={stableTilt(comment.id)}
                />
              </div>
            ))}
          </CordeALinge>
        )}
      </section>

      <AddPhotoModal
        open={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        onPublished={refetchPlanche}
      />
    </div>
  )
}
