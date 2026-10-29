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
 * Bandeau « transmission » de la fiche recette : carte pleine sans bordure
 * (fond papier-âgé, radius 12 px). « Transmise par {auteur} · dans le carnet
 * depuis {date} · cuisinée {n} fois ».
 */
export function TransmissionBanner({ author, recipeCreatedAt, cookedCount }: TransmissionBannerProps) {
  return (
    <div className="rounded-xl bg-ble-clair px-4 py-3 flex items-center gap-3 anim-enter">
      {author && <Avatar name={author.display_name} src={author.avatar_url} size="md" />}
      <div className="min-w-0">
        <p className="text-encre leading-snug">
          Transmise par{' '}
          <strong className="font-serif text-xl">{author?.display_name ?? '…'}</strong>
          {author?.family_role && (
            <span className="text-encre-doux"> · {author.family_role}</span>
          )}
        </p>
        <p className="text-encre-doux mt-0.5">
          Dans le carnet depuis {formatDate(recipeCreatedAt)} ({formatRelative(recipeCreatedAt)})
          {' · '}
          {cookedCount > 0 ? (
            <>
              cuisinée <strong className="text-tomate">{cookedCount} fois</strong>
            </>
          ) : (
            'pas encore sortie du four'
          )}
        </p>
      </div>
    </div>
  )
}
