import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useRecipes } from '@/hooks/useRecipes'
import { useRecentComments } from '@/hooks/useComments'
import { useAuth } from '@/context/AuthContext'
import { usePageTitle } from '@/lib/usePageTitle'
import { deleteComment, fetchPlancheComments, updateComment } from '@/services/comments'
import { AddPhotoModal } from '@/components/planche/AddPhotoModal'
import { EditMomentModal } from '@/components/planche/EditMomentModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PaywallModal } from '@/components/monetisation/PaywallModal'
import { PremiumGate } from '@/components/monetisation/PremiumGate'
import { useFamillePlan } from '@/hooks/useFamillePlan'
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
import { SignalerButton } from '@/components/ui/SignalerButton'
import { DailyRecipeCard } from '@/components/recipes/DailyRecipeCard'
import type { RecipeComment } from '@/lib/types'

const NO_FILTERS = { query: '', category: 'toutes' as const, authorId: 'tous' as const }

export function HomePage() {
  usePageTitle()
  const { profile, family } = useAuth()
  const { recipes, loading } = useRecipes(NO_FILTERS)
  const { items: recentActivity, loading: activityLoading } = useRecentComments(5)

  // Moments de la planche publiés sans recette (photo + commentaire, famille).
  // Pagination par pages de 12 : même après 10 ans de vie d'une famille
  // nombreuse, la planche ne charge jamais tout d'un bloc — les vieux
  // moments se sortent au clic, et la page reste légère.
  const [plancheMoments, setPlancheMoments] = useState<RecipeComment[]>([])
  const [plancheLoading, setPlancheLoading] = useState(true)
  const [momentsHasMore, setMomentsHasMore] = useState(false)
  const [momentsLoadingMore, setMomentsLoadingMore] = useState(false)
  const [photoModalOpen, setPhotoModalOpen] = useState(false)
  // Modifier ou retirer SES moments de la planche (confirmation Oui/Non)
  const [editingMoment, setEditingMoment] = useState<RecipeComment | null>(null)
  const [confirmRemoveMomentId, setConfirmRemoveMomentId] = useState<string | null>(null)

  const refetchPlanche = useCallback(async (silent = false) => {
    if (!profile?.family_id) {
      setPlancheMoments([])
      setMomentsHasMore(false)
      setPlancheLoading(false)
      return
    }
    // silent : après publication, la planche se met à jour sans spinner —
    // la page garde sa hauteur et sa position (aucun retour en haut).
    if (!silent) setPlancheLoading(true)
    try {
      const page = await fetchPlancheComments(profile.family_id, { limit: 12 })
      setPlancheMoments(page.items)
      setMomentsHasMore(page.hasMore)
    } catch {
      setPlancheMoments([])
      setMomentsHasMore(false)
    }
    setPlancheLoading(false)
  }, [profile?.family_id])

  /** Charge la page de moments plus anciens, sans retour en haut */
  const loadMoreMoments = useCallback(async () => {
    if (!profile?.family_id || momentsLoadingMore) return
    const oldest = plancheMoments[plancheMoments.length - 1]?.created_at
    if (!oldest) return
    setMomentsLoadingMore(true)
    try {
      const page = await fetchPlancheComments(profile.family_id, { before: oldest, limit: 12 })
      setPlancheMoments((prev) => {
        const seen = new Set(prev.map((c) => c.id))
        return [...prev, ...page.items.filter((c) => !seen.has(c.id))]
      })
      setMomentsHasMore(page.hasMore)
    } catch {
      /* réseau capricieux : on garde les moments déjà affichés */
    }
    setMomentsLoadingMore(false)
  }, [profile?.family_id, plancheMoments, momentsLoadingMore])

  useEffect(() => {
    refetchPlanche()
  }, [refetchPlanche])

  // Sivia Plus : la planche est un extra — vitrine floutée sans le plan
  const { premium, refetch: refetchPlan } = useFamillePlan()
  const [paywallOpen, setPaywallOpen] = useState(false)
  // Planche familiale personnalisable : les photos publiées par toute la famille,
  // les moments sans recette, et les derniers contenus (photos, anecdotes)
  // partagés en commentaires de recettes.
  const recentPhotos = recipes.filter((r) => r.photo_url).slice(0, 6)
  const photoComments = recentActivity.filter((c) => c.photo_url && c.recipe_id).slice(0, 6)
  const moments = plancheMoments.filter((c) => c.photo_url)
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
          {/* Le « + » de la planche ouvre le modal photo — jamais le formulaire de recette.
              Extra Sivia Plus : le bouton n'existe pas sans le plan. */}
          {premium && (
            <Button onClick={() => setPhotoModalOpen(true)} aria-label="Ajouter une photo à la planche familiale">
              <Plus size={18} aria-hidden="true" /> Ajouter
            </Button>
          )}
        </div>
        {(() => {
          // Corps unique de la planche : affiché tel quel avec le plan,
          // en vitrine floutée sous le voile premium sans le plan.
          const plancheBody = isLoading ? (
                      <Spinner label={COPY.loading.planche} />
                    ) : plancheEmpty ? (
                      <EmptyState title="La planche est vide" handText={COPY.empty.planche}>
                        <Button onClick={() => setPhotoModalOpen(true)}>
                          <Plus size={18} aria-hidden="true" /> Accrocher la première photo
                        </Button>
                      </EmptyState>
                    ) : (
                      <>
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
                              alt={recipe.title}
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
                              alt={`Photo partagée par ${comment.author?.display_name ?? 'la famille'}`}
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
                              alt={comment.body ? `Moment de cuisine partagé par ${comment.author?.display_name ?? 'la famille'}` : `Photo de ${comment.author?.display_name ?? 'la famille'}`}
                              tilt={stableTilt(comment.id)}
                              overlay={
                                comment.author_id === profile?.id ? (
                                  <span className="absolute top-2 right-2 flex flex-col items-end gap-1.5 z-10">
                                    <button
                                      type="button"
                                      onClick={() => setEditingMoment(comment)}
                                      aria-label="Modifier le mot de ce moment"
                                      className="min-h-8 min-w-8 rounded-full bg-carte/85 shadow-sm inline-flex items-center justify-center text-encre-doux hover:text-vert"
                                    >
                                      <Pencil size={14} aria-hidden="true" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmRemoveMomentId(comment.id)}
                                      aria-label="Retirer ce moment de la planche"
                                      className="min-h-8 min-w-8 rounded-full bg-carte/85 shadow-sm inline-flex items-center justify-center text-encre-doux hover:text-tomate"
                                    >
                                      <Trash2 size={14} aria-hidden="true" />
                                    </button>
                                  </span>
                                ) : (
                                  <span className="absolute top-2 right-2 z-10">
                                    <SignalerButton
                                      label={`le moment de ${comment.author?.display_name ?? 'quelqu\u2019un'}`}
                                    />
                                  </span>
                                )
                              }
                            />
                            {confirmRemoveMomentId === comment.id && (
                              <div className="mt-1 w-full flex justify-center">
                                <ConfirmDialog
                                  title="Retirer ?"
                                  message="La photo et son mot quitteront la planche familiale."
                                  onCancel={() => setConfirmRemoveMomentId(null)}
                                  onConfirm={() => {
                                    setConfirmRemoveMomentId(null)
                                    void (async () => {
                                      await deleteComment(comment.id)
                                      await refetchPlanche(true)
                                    })()
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </CordeALinge>
                      {momentsHasMore && (
                        <div className="mt-4 text-center">
                          <Button
                            variant="outline"
                            onClick={loadMoreMoments}
                            disabled={momentsLoadingMore}
                          >
                            {momentsLoadingMore ? 'On ressort les vieux moments…' : 'Voir les moments plus anciens'}
                          </Button>
                        </div>
                      )}
                      </>
                    )
          return premium ? (
            plancheBody
          ) : (
            <PremiumGate
              title="La planche photos de la famille"
              description="Les photos de cuisine accrochées par toute la famille, jour après jour — le frigo de la maison, version Sivia."
              openPaywall={() => setPaywallOpen(true)}
            >
              {plancheBody}
            </PremiumGate>
          )
        })()}
      </section>

      <AddPhotoModal
        open={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        onPublished={() => refetchPlanche(true)}
      />
      {/* Modifier le mot d'un de ses moments de la planche */}
      <EditMomentModal
        moment={editingMoment}
        onClose={() => setEditingMoment(null)}
        onSaved={async (body) => {
          if (!editingMoment) return
          await updateComment(editingMoment.id, body)
          setEditingMoment(null)
          await refetchPlanche(true)
        }}
      />
      <PaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        onRefresh={refetchPlan}
      />
    </div>
  )
}