import { cn } from '@/lib/utils'

interface TorchonProps {
  /** Initiale ou libellé court affiché au centre (ex: première lettre de la catégorie) */
  label?: string
  className?: string
}

/**
 * Motif « torchon » : grille de lignes épaisses bleu sur fond crème,
 * comme un torchon à carreaux. Utilisé quand une recette n'a pas de photo.
 */
export function Torchon({ label, className }: TorchonProps) {
  return (
    <div
      className={cn('absolute inset-0 flex items-center justify-center', className)}
      style={{
        backgroundColor: '#fbf6ec',
        backgroundImage: [
          'repeating-linear-gradient(0deg, transparent, transparent 34px, rgba(91, 122, 158, 0.35) 34px, rgba(91, 122, 158, 0.35) 38px)',
          'repeating-linear-gradient(90deg, transparent, transparent 34px, rgba(91, 122, 158, 0.35) 34px, rgba(91, 122, 158, 0.35) 38px)',
          'repeating-linear-gradient(0deg, transparent, transparent 6px, rgba(91, 122, 158, 0.12) 6px, rgba(91, 122, 158, 0.12) 8px)',
          'repeating-linear-gradient(90deg, transparent, transparent 6px, rgba(91, 122, 158, 0.12) 6px, rgba(91, 122, 158, 0.12) 8px)',
        ].join(', '),
      }}
      role="img"
      aria-label={label ? `Pas de photo — catégorie ${label}` : 'Pas de photo pour cette recette'}
    >
      {label && (
        <span
          className="w-16 h-16 rounded-full bg-creme/95 border-2 border-bleu-dark/40 text-bleu-dark font-serif font-bold text-3xl flex items-center justify-center shadow-card"
          aria-hidden="true"
        >
          {label.charAt(0)}
        </span>
      )}
    </div>
  )
}
