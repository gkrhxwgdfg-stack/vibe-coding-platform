import { Link } from 'react-router-dom'
import { ChevronRight, ImagePlus, MessageCircle, Plus, Sparkles } from 'lucide-react'
import { useRecipes } from '@/hooks/useRecipes'
import { useRecentComments } from '@/hooks/useComments'
import { useAuth } from '@/context/AuthContext'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { Polaroid } from '@/components/ui/Polaroid'
import { photoPublicUrl } from '@/services/recipes'
import { formatRelative } from '@/lib/format'

const NO_FILTERS = { query: '', category: 'toutes' as const, authorId: 'tous' as const }

export function HomePage() {
  const { profile, family } = useAuth()
  const { recipes, loading } = useRecipes(NO_FILTERS)
  const { items: recentActivity, loading: activityLoading } = useRecentComments(5)

  // Planche familiale personnalisable : les photos publi\u00e9es par toute la famille,
  // et les derniers contenus (photos, anecdotes) partag\u00e9s en commentaires.
  const recentPhotos = recipes.filter((r) => r.photo_url).slice(0, 6)
  const photoComments = recentActivity.filter((c) => c.photo_url).slice(0, 6)
  const plancheEmpty = recentPhotos.length === 0 && photoComments.length === 0

  const notifications = recentActivity.map((c) => ({
    id: c.id,
    recipeId: c.recipe_id,
    recipeTitle: c.recipeTitle ?? 'une recette',
    authorName: c.author?.display_name ?? 'Quelqu\u2019un',
    hasPhoto: Boolean(c.photo_url),
    createdAt: c.created_at,
  }))

  return (
    <div className="space-y-8">
      {/* Hero doux */}
      <section aria-labelledby="home-title">
        <p className="kicker">Le carnet de {family?.name ?? 'ta famille'}</p>
        <h1 id="home-title" className="text-4xl font-bold mt-1">
          Bonjour, {profile?.display_name}
        </h1>
        <p className="text-hand text-bleu text-2xl mt-1">Qu\u2019est-ce qu\u2019on cuisine aujourd\u2019hui ?</p>
      </section>

      {/* Planche familiale : moments de cuisine partag\u00e9s (tableau de photos) */}
      <section aria-labelledby="planche-title">
        <CardHeader kicker="Planche familiale" title="Moments de cuisine partag\u00e9s" />
        {loading || activityLoading ? (
          <Spinner label="On d\u00e9core la planche\u2026" />
        ) : plancheEmpty ? (
          <EmptyState handText="La planche est encore vide. La premi\u00e8re photo de la famille la remplira.">
            <Link to="/recettes/nouvelle">
              <Button size="lg">
                <Plus size={20} aria-hidden="true" /> Publier une recette avec sa photo
              </Button>
            </Link>
          </EmptyState>
        ) : (
          <div className="flex flex-wrap gap-4 justify-center">
            {recentPhotos.map((recipe, i) => (
              <Link key={recipe.id} to={`/recettes/${recipe.id}`} className="hover:-translate-y-1 transition-transform">
                <Polaroid
                  src={photoPublicUrl(recipe.photo_url)}
                  caption={`${recipe.title} \u2014 ${recipe.author?.display_name ?? ''}`}
                  tilt={i % 2 === 0 ? -2.5 : 2.5}
                />
              </Link>
            ))}
            {photoComments.map((comment, i) => (
              <Link key={comment.id} to={`/recettes/${comment.recipe_id}`} className="hover:-translate-y-1 transition-transform">
                <Polaroid
                  src={photoPublicUrl(comment.photo_url)}
                  caption={`${comment.recipeTitle ?? 'Une recette'} \u2014 ${comment.author?.display_name ?? ''}`}
                  tilt={i % 2 === 0 ? 2.5 : -2.5}
                />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Notifications : ce que la famille a partag\u00e9 r\u00e9cemment */}
      <section aria-labelledby="notifs-title">
        <CardHeader kicker="Notifications" title="La famille a partag\u00e9" />
        {activityLoading ? (
          <Spinner label="On \u00e9coute la cuisine\u2026" />
        ) : notifications.length === 0 ? (
          <p className="text-encre-soft">
            Rien de neuf pour le moment. Quand quelqu\u2019un publiera une recette ou ajoutera une
            photo, tu le verras ici.
          </p>
        ) : (
          <ul className="space-y-3">
            {notifications.map((notif) => (
              <li key={notif.id}>
                <Link
                  to={`/recettes/${notif.recipeId}`}
                  className="card-surface p-4 flex items-center gap-4 hover:shadow-soft transition-shadow"
                >
                  <span className="w-11 h-11 rounded-full bg-moutarde/20 text-terra flex items-center justify-center shrink-0">
                    {notif.hasPhoto ? (
                      <ImagePlus size={20} aria-hidden="true" />
                    ) : (
                      <MessageCircle size={20} aria-hidden="true" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold truncate">
                      {notif.authorName}{' '}
                      <span className="font-normal text-encre-soft">
                        {notif.hasPhoto ? 'a ajout\u00e9 une photo sur' : 'a comment\u00e9'}{' '}
                        \u00ab {notif.recipeTitle} \u00bb
                      </span>
                    </span>
                    <span className="text-sm text-encre-soft">{formatRelative(notif.createdAt)}</span>
                  </span>
                  <ChevronRight size={18} className="text-encre-soft shrink-0" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Appel \u00e0 l'action doux */}
      <Card className="text-center bg-gradient-to-br from-creme to-moutarde/15">
        <Sparkles size={28} className="mx-auto text-moutarde mb-2" aria-hidden="true" />
        <p className="font-serif text-xl font-semibold mb-1">Une recette dort dans un tiroir ?</p>
        <p className="text-encre-soft mb-4">C\u2019est celle de grand-m\u00e8re, celle qu\u2019on se transmet \u00e0 voix basse\u2026</p>
        <Link to="/recettes/nouvelle">
          <Button size="lg" variant="outline">
            <Plus size={20} aria-hidden="true" /> La raconter dans Savia
          </Button>
        </Link>
      </Card>
    </div>
  )
}
