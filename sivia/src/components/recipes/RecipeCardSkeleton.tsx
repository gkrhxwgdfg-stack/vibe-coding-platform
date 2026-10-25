import { cn } from '@/lib/utils'

/**
 * Squelette papier d'une carte recette, en chargement.
 * Fond lin + pulsation (`.skeleton-paper`, chantier 1) — remplace le Spinner
 * sur les listes. Même gabarit que RecipeCard pour éviter tout saut visuel.
 */
export function RecipeCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('card-surface overflow-hidden p-0 anim-enter', className)} aria-hidden="true">
      <div className="skeleton-paper aspect-[16/10] rounded-none" />
      <div className="p-4 space-y-3">
        <div className="skeleton-paper h-6 w-3/4" />
        <div className="skeleton-paper h-4 w-1/2" />
        <div className="flex gap-4">
          <div className="skeleton-paper h-4 w-16" />
          <div className="skeleton-paper h-4 w-20" />
        </div>
      </div>
    </div>
  )
}

/** Grille de squelettes papier pour la bibliothèque / les favoris */
export function RecipeCardSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <RecipeCardSkeleton key={i} />
      ))}
    </div>
  )
}
