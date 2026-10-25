import { Avatar } from '@/components/ui/Avatar'
import { formatDate, formatRelative } from '@/lib/format'
import type { Profile } from '@/lib/types'

interface TransmissionBannerProps {
  author?: Profile
  /** Date d'entrée de la recette dans le carnet */
  recipeCreatedAt: string
  /** Nombre de fois où la recette a été cuisinée (fil de vie) */
  cookedCount: number
}

/**
 * Bandeau « transmission » de la fiche recette : point de couture terracotta
 * (dashed 1.5 px, radius 12 px). « Transmise par {auteur} · dans le carnet
 * depuis {date} · cuisinée {n} fois ».
 */
export function TransmissionBanner({ author, recipeCreatedAt, cookedCount }: TransmissionBannerProps) {
  return (
    <div className="stitch-border bg-creme px-4 py-3 flex items-center gap-3 anim-enter">
      {author && <Avatar name={author.display_name} src={author.avatar_url} size="md" />}
      <p className="text-encre-soft">
        Transmise par{' '}
        <strong className="text-encre font-serif text-lg">
          {author?.display_name ?? '…'}
          {author?.family_role && (
            <span className="text-encre-soft font-sans text-sm font-normal"> ({author.family_role})</span>
          )}
        </strong>
        {' · '}
        dans le carnet depuis {formatDate(recipeCreatedAt)} ({formatRelative(recipeCreatedAt)})
        {' · '}
        {cookedCount > 0 ? (
          <>
            cuisinée <strong className="text-terra">{cookedCount} fois</strong>
          </>
        ) : (
          'pas encore sortie du four'
        )}
      </p>
    </div>
  )
}
