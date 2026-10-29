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
        backgroundColor: '#ffffff',
        backgroundImage:
          'radial-gradient(rgba(46, 89, 57, 0.16) 1.6px, transparent 1.6px)',
        backgroundSize: '16px 16px',
      }}
      role="img"
      aria-label={label ? `Pas de photo — catégorie ${label}` : 'Pas de photo pour cette recette'}
    >
      {label && (
        <span
          className="w-16 h-16 rounded-full bg-carte/95 border-2 border-vert/40 text-vert font-serif font-bold text-3xl flex items-center justify-center shadow-card"
          aria-hidden="true"
        >
          {label.charAt(0)}
        </span>
      )}
    </div>
  )
}
