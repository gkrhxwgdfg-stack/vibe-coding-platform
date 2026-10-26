import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useRecipes } from '@/hooks/useRecipes'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { COPY } from '@/lib/copy'
import { RecipeCardSkeletonGrid } from '@/components/recipes/RecipeCardSkeleton'
import { RecipeCard } from '@/components/recipes/RecipeCard'

const NO_FILTERS = { query: '', category: 'toutes' as const, authorId: 'tous' as const }

export function FavoritesPage() {
  const { recipes, loading } = useRecipes(NO_FILTERS)
  const favorites = recipes.filter((r) => r.is_favorite)

  return (
    <div className="space-y-6">
      <div>
        <p className="kicker">À garder sous le coude</p>
        <h1 className="text-3xl font-bold mt-1 flex items-center gap-3">
          <Heart className="text-carmine fill-carmine" size={30} aria-hidden="true" />
          Mes favoris
        </h1>
      </div>
      {loading ? (
        <RecipeCardSkeletonGrid count={4} />
      ) : favorites.length === 0 ? (
        <EmptyState title="Pas encore de chouchous" handText={COPY.empty.favoris}>
          <Link to="/recettes">
            <Button size="lg">Farfouiller dans le carnet</Button>
          </Link>
        </EmptyState>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {favorites.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  )
}
