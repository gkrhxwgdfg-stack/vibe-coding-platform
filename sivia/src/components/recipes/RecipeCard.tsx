import { Link } from 'react-router-dom'
import { Clock, Heart, Lock, Users } from 'lucide-react'
import type { RecipeWithMeta } from '@/lib/types'
import { categoryMeta } from '@/lib/constants'
import { formatDate, formatDuration } from '@/lib/format'
import { photoPublicUrl } from '@/services/recipes'
import { Torchon } from '@/components/ui/Torchon'

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
      className="group block card-surface overflow-hidden p-0 hover:border-vert/40 hover:-translate-y-[3px] transition-all"
      style={{ transitionDuration: '250ms', transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
    >
      <div className="relative aspect-[16/10] bg-papier overflow-hidden">
        {photo ? (
          <img
            src={photo}
            alt={recipe.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform"
            style={{ transitionDuration: '250ms', transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
          />
        ) : (
          <Torchon label={meta.label} />
        )}
        <span className="absolute top-3 left-3 bg-carte/95 rounded-full px-3 py-1 text-[12.5px] font-extrabold uppercase tracking-[0.12em] text-tomate">
          {meta.label}
        </span>
        {recipe.is_sealed && (
          <span className="absolute top-3 right-3 bg-carte/95 rounded-full px-3 py-1 text-sm font-bold text-tomate flex items-center gap-1">
            <Lock size={13} aria-hidden="true" /> Scellée
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-serif font-semibold text-[21px] leading-snug group-hover:text-vert transition-colors">
          {recipe.title}
        </h3>
        <p className="text-[13.5px] font-bold text-encre-doux mt-0.5 leading-tight">
          transmise par {recipe.author?.display_name ?? '…'}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-encre-doux">
          <span className="inline-flex items-center gap-1">
            <Users size={15} aria-hidden="true" /> {recipe.servings} parts
          </span>
          {totalTime > 0 && (
            <span className="inline-flex items-center gap-1">
              <Clock size={15} aria-hidden="true" /> {formatDuration(totalTime)}
            </span>
          )}
          {recipe.is_favorite && (
            <span className="inline-flex items-center gap-1 text-tomate">
              <Heart size={19} aria-hidden="true" className="fill-tomate" />
              Favori
            </span>
          )}
        </div>
        <p className="text-sm text-encre-doux mt-2">Créée le {formatDate(recipe.created_at)}</p>
      </div>
    </Link>
  )
}
