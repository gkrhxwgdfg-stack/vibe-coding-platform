import { Link } from 'react-router-dom'
import { ChevronRight, Heart, Plus, Sparkles } from 'lucide-react'
import { useRecipes } from '@/hooks/useRecipes'
import { useAuth } from '@/context/AuthContext'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { RecipeCard } from '@/components/recipes/RecipeCard'
import { Polaroid } from '@/components/ui/Polaroid'
import { photoPublicUrl } from '@/services/recipes'
import { formatRelative } from '@/lib/format'

const NO_FILTERS = { query: '', category: 'toutes' as const, authorId: 'tous' as const }

export function HomePage() {
  const { profile, family } = useAuth()
  const { recipes, loading } = useRecipes(NO_FILTERS)

  const recipeOfTheMoment = recipes[0] ?? null
  const favorites = recipes.filter((r) => r.is_favorite)
  const recentPhotos = recipes.filter((r) => r.photo_url).slice(0, 6)

  return (
    <div className="space-y-8">
      {/* Hero doux */}
      <section aria-labelledby="home-title">
        <p className="kicker">Le carnet de {family?.name ?? 'ta famille'}</p>
        <h1 id="home-title" className="text-4xl font-bold mt-1">
          Bonjour, {profile?.display_name} 👋
        </h1>
        <p className="text-hand text-bleu text-2xl mt-1">Qu’est-ce qu’on cuisine aujourd’hui ?</p>
      </section>

      {/* Recette du moment */}
      <section aria-labelledby="moment-title">
        <CardHeader
          kicker="Recette du moment"
          title="Celle qu’on ressort ce dimanche"
          action={
            <Link to="/recettes" className="text-terra font-bold inline-flex items-center gap-1 min-h-11">
              Tout voir <ChevronRight size={18} aria-hidden="true" />
            </Link>
          }
        />
        {loading ? (
          <Spinner />
        ) : recipeOfTheMoment ? (
          <RecipeCard recipe={recipeOfTheMoment} />
        ) : (
          <EmptyState handText="Toute famille a une première recette. Laquelle est la vôtre ?">
            <Link to="/recettes/nouvelle">
              <Button size="lg">
                <Plus size={20} aria-hidden="true" /> Écrire notre première recette
              </Button>
            </Link>
          </EmptyState>
        )}
      </section>

      {/* Planche familiale : moments de cuisine partagés (photos polaroid) */}
      {recentPhotos.length > 0 && (
        <section aria-labelledby="planche-title">
          <CardHeader kicker="Planche familiale" title="Moments de cuisine partagés" />
          <div className="flex flex-wrap gap-4 justify-center">
            {recentPhotos.map((recipe, i) => (
              <Link key={recipe.id} to={`/recettes/${recipe.id}`} className="hover:-translate-y-1 transition-transform">
                <Polaroid
                  src={photoPublicUrl(recipe.photo_url)}
                  caption={`${recipe.title} — ${formatRelative(recipe.created_at)}`}
                  tilt={i % 2 === 0 ? -2.5 : 2.5}
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Favoris rapides */}
      {favorites.length > 0 && (
        <section aria-labelledby="fav-title">
          <CardHeader
            kicker="À portée de main"
            title="Tes recettes préférées"
            action={
              <Link to="/favoris" className="text-terra font-bold inline-flex items-center gap-1 min-h-11">
                <Heart size={18} aria-hidden="true" /> Tous les favoris
              </Link>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {favorites.slice(0, 4).map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </section>
      )}

      {/* Appel à l'action doux */}
      <Card className="text-center bg-gradient-to-br from-creme to-moutarde/15">
        <Sparkles size={28} className="mx-auto text-moutarde mb-2" aria-hidden="true" />
        <p className="font-serif text-xl font-semibold mb-1">Une recette dort dans un tiroir ?</p>
        <p className="text-encre-soft mb-4">C’est celle de grand-mère, celle qu’on se transmet à voix basse…</p>
        <Link to="/recettes/nouvelle">
          <Button size="lg" variant="outline">
            <Plus size={20} aria-hidden="true" /> La raconter dans Savia
          </Button>
        </Link>
      </Card>
    </div>
  )
}
