import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, X } from 'lucide-react'
import { useRecipes } from '@/hooks/useRecipes'
import { useFamilyMembers } from '@/hooks/useFamily'
import { CATEGORIES } from '@/lib/constants'
import type { RecipeCategory, RecipeFilters } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { COPY } from '@/lib/copy'
import { MOTION } from '@/lib/motion'
import { RecipeCardSkeletonGrid } from '@/components/recipes/RecipeCardSkeleton'
import { RecipeCard } from '@/components/recipes/RecipeCard'
import { cn } from '@/lib/utils'

type CategoryFilter = RecipeCategory | 'toutes'

export function RecipesPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('toutes')
  const [authorId, setAuthorId] = useState<string>('tous')

  const filters: RecipeFilters = useMemo(
    () => ({ query, category, authorId }),
    [query, category, authorId],
  )
  const { recipes, loading, error, refetch } = useRecipes(filters)
  const { members } = useFamilyMembers()

  const hasActiveFilters = query.trim() !== '' || category !== 'toutes' || authorId !== 'tous'

  function resetFilters() {
    setQuery('')
    setCategory('toutes')
    setAuthorId('tous')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="kicker">Le livre de recettes</p>
          <h1 className="text-3xl font-bold mt-1">Nos recettes de famille</h1>
        </div>
        <Link to="/recettes/nouvelle" aria-label="Nouvelle recette">
          <Button variant="outline">
            <Plus size={18} aria-hidden="true" /> Nouvelle
          </Button>
        </Link>
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-encre-doux pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Farfouiller : un mot, un ingrédient, une histoire…"
          aria-label="Rechercher une recette"
          className="w-full min-h-13 rounded-[14px] border-[1.5px] border-encre-doux/28 bg-carte pl-12 pr-12 text-lg focus:border-vert focus:ring-3 focus:ring-vert-clair focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Effacer la recherche"
            className="absolute right-3 top-1/2 -translate-y-1/2 touch-target-lg min-h-11 min-w-11 flex items-center justify-center text-encre-doux hover:text-encre"
          >
            <X size={20} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Filtres par catégorie (intercalaires) : soulignement glissant sur la fiche active */}
      <div role="group" aria-label="Filtrer par catégorie" className="flex flex-wrap gap-2">
        {[{ value: 'toutes' as const, label: 'Toutes' }, ...CATEGORIES].map((c, i) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setCategory(c.value)}
            aria-pressed={category === c.value}
            className={cn(
              'chip-underline anim-enter min-h-11 px-4 rounded-full border-2 font-bold transition-colors',
              category === c.value
                ? 'bg-vert text-white border-vert'
                : 'bg-carte text-encre border-encre-doux/20 hover:border-vert hover:text-vert',
            )}
            style={{ animationDelay: `${i * MOTION.stagger}ms` }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Filtre par membre */}
      {members.length > 1 && (
        <div role="group" aria-label="Filtrer par membre" className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-bold text-encre-doux">Par membre :</span>
          {[{ id: 'tous', name: 'Tous' }, ...members.map((m) => ({ id: m.id, name: m.display_name }))].map(
            (m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setAuthorId(m.id)}
                aria-pressed={authorId === m.id}
                className={cn(
                  'min-h-11 px-4 rounded-full border-2 font-bold transition-colors',
                  authorId === m.id
                    ? 'bg-vert text-white border-vert'
                    : 'bg-carte text-encre border-encre-doux/20 hover:border-vert hover:text-vert',
                )}
              >
                {m.name}
              </button>
            ),
          )}
        </div>
      )}

      {hasActiveFilters && (
        <button type="button" onClick={resetFilters} className="text-tomate font-bold min-h-11 hover:underline">
          {COPY.actions.remuer}
        </button>
      )}

      {/* Résultats */}
      {loading ? (
        <RecipeCardSkeletonGrid count={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : recipes.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState title="Rien à cette page" handText={COPY.empty.recherche}>
            <Button size="lg" variant="outline" onClick={resetFilters}>
              <X size={20} aria-hidden="true" /> Effacer
            </Button>
          </EmptyState>
        ) : (
          <EmptyState title="Le carnet est vide" handText="Toute famille a une première recette. Laquelle est la vôtre ?">
            <Link to="/recettes/nouvelle">
              <Button size="lg">
                <Plus size={20} aria-hidden="true" /> Écrire une recette
              </Button>
            </Link>
          </EmptyState>
        )
      ) : (
        <>
          <p className="text-encre-doux" aria-live="polite">
            {recipes.length} recette{recipes.length > 1 ? 's' : ''} dans le carnet
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            {recipes.map((recipe, i) => (
              <div
                key={recipe.id}
                className="anim-pop hover:-translate-y-[3px] transition-transform"
                style={{
                  animationDelay: `${i * MOTION.stagger}ms`,
                  transitionDuration: '250ms',
                  transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                <RecipeCard recipe={recipe} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
