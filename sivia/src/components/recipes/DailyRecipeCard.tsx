import { Link } from 'react-router-dom'
import { Sun } from 'lucide-react'
import type { RecipeWithMeta } from '@/lib/types'
import { categoryMeta } from '@/lib/constants'
import { photoPublicUrl } from '@/services/recipes'
import { Stamp } from '@/components/ui/Stamp'
import { Torchon } from '@/components/ui/Torchon'
import { Twine } from '@/components/ui/Twine'

interface DailyRecipeCardProps {
  recipe: RecipeWithMeta
}

/**
 * Carte « Le plat du dimanche » : la recette choisie pour la journée
 * (sélection stable, graine = AAAAMMJJ, cf. pickDaily). Tampon de la maison,
 * un tap sur la carte ouvre la fiche.
 */
export function DailyRecipeCard({ recipe }: DailyRecipeCardProps) {
  const meta = categoryMeta(recipe.category)
  const photo = photoPublicUrl(recipe.photo_url)

  return (
    <Link
      to={`/recettes/${recipe.id}`}
      className="group relative block card-surface overflow-visible p-0 anim-pop hover:-translate-y-[3px] transition-transform"
    >
      <Twine corner="top-left" />
      <div className="relative aspect-[16/10] bg-papier overflow-hidden rounded-t-[1.25rem]">
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
        <span className="absolute top-3 left-3 bg-carte/95 rounded-full px-3 py-1 text-sm font-bold text-vert inline-flex items-center gap-1.5">
          <Sun size={14} aria-hidden="true" /> Le plat du dimanche
        </span>
      </div>
      <div className="p-4">
        <h2 className="font-serif font-semibold text-2xl leading-snug group-hover:text-vert transition-colors">
          {recipe.title}
        </h2>
        <p className="text-[13.5px] font-bold text-encre-doux mt-0.5 leading-tight">
          transmise par {recipe.author?.display_name ?? '…'}
        </p>
      </div>
      {recipe.author && (
        <span className="absolute -bottom-4 -right-3 rotate-[-6deg] opacity-90">
          <Stamp name={recipe.author.display_name} className="w-20 h-20 border-[2.5px] [&>span:last-child]:text-base" />
        </span>
      )}
    </Link>
  )
}
