import { Link } from 'react-router-dom'
import { Clock, Heart, Lock, Users } from 'lucide-react'
import type { RecipeWithMeta } from '@/lib/types'
import { categoryMeta } from '@/lib/constants'
import { formatDate, formatDuration } from '@/lib/format'
import { photoPublicUrl } from '@/services/recipes'
import { cn } from '@/lib/utils'

interface RecipeCardProps {
  recipe: RecipeWithMeta
}

/** Carte recette : photo polaroid, catégorie, auteur, temps, favori */
export function RecipeCard({ recipe }: RecipeCardProps) {
  const meta = categoryMeta(recipe.category)
  const totalTime = (recipe.prep_time ?? 0) + (recipe.cook_time ?? 0)
  const photo = photoPublicUrl(recipe.photo_url)

  return (
    <Link
      to={`/recettes/${recipe.id}`}
      className="group block card-surface overflow-hidden p-0 hover:shadow-soft transition-shadow"
    >
      <div className="relative aspect-[16/10] bg-lin overflow-hidden">
        {photo ? (
          <img
            src={photo}
            alt={recipe.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-moutarde/25 to-terra/25 flex items-center justify-center">
            <span className="text-5xl" aria-hidden="true">{meta.emoji}</span>
          </div>
        )}
        <span className="absolute top-3 left-3 bg-creme/95 rounded-full px-3 py-1 text-sm font-bold text-terra">
          {meta.emoji} {meta.label}
        </span>
        {recipe.is_sealed && (
          <span className="absolute top-3 right-3 bg-creme/95 rounded-full px-3 py-1 text-sm font-bold text-encre flex items-center gap-1">
            <Lock size={13} aria-hidden="true" /> Scellée
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-serif font-semibold text-xl leading-snug group-hover:text-terra transition-colors">
          {recipe.title}
        </h3>
        <p className="text-hand text-bleu text-lg mt-0.5">
          de la main de {recipe.author?.display_name ?? '…'}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-encre-soft">
          <span className="inline-flex items-center gap-1">
            <Users size={15} aria-hidden="true" /> {recipe.servings} parts
          </span>
          {totalTime > 0 && (
            <span className="inline-flex items-center gap-1">
              <Clock size={15} aria-hidden="true" /> {formatDuration(totalTime)}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Heart
              size={15}
              aria-hidden="true"
              className={cn(recipe.is_favorite && 'fill-carmine text-carmine')}
            />
            {recipe.is_favorite ? 'Favori' : ''}
          </span>
        </div>
        <p className="text-xs text-encre-soft mt-2">Ajoutée le {formatDate(recipe.created_at)}</p>
      </div>
    </Link>
  )
}
