import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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

  return (
    <div className="space-y-6">
      {/* Hero doux */}
      <section aria-labelledby="home-title">
        <p className="kicker">Le carnet de {family?.name ?? 'ta famille'}</p>
        <h1 id="home-title" className="text-4xl font-bold mt-1">
          Bonjour, {profile?.display_name}
        </h1>
        <p className="text-hand text-bleu text-2xl mt-1">Qu’est-ce qu’on cuisine aujourd’hui ?</p>
      </section>

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
          <Spinner label="On décore la planche…" />
        ) : plancheEmpty ? (
          <EmptyState handText="La planche est encore vide. La première photo de la famille la remplira.">
            <Button size="lg" onClick={() => setPhotoModalOpen(true)}>
              <Plus size={20} aria-hidden="true" /> Accrocher la première photo
            </Button>
          </EmptyState>
        ) : (
          <div className="flex flex-wrap gap-4 justify-center">
            {recentPhotos.map((recipe, i) => (
              <Link key={recipe.id} to={`/recettes/${recipe.id}`} className="hover:-translate-y-1 transition-transform">
                <Polaroid
                  src={photoPublicUrl(recipe.photo_url)}
                  caption={`${recipe.title} — ${recipe.author?.display_name ?? ''}`}
                  tilt={i % 2 === 0 ? -2.5 : 2.5}
                />
              </Link>
            ))}
            {photoComments.map((comment, i) => (
              <Link key={comment.id} to={`/recettes/${comment.recipe_id}`} className="hover:-translate-y-1 transition-transform">
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
                  tilt={i % 2 === 0 ? 2.5 : -2.5}
                />
              </Link>
            ))}
            {moments.map((comment, i) => (
              <Polaroid
                key={comment.id}
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
                tilt={(recentPhotos.length + photoComments.length + i) % 2 === 0 ? -2.5 : 2.5}
              />
            ))}
          </div>
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
