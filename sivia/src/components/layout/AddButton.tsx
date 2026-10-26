import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { AddAction } from '@/lib/addAction'
import { cn } from '@/lib/utils'

interface AddButtonProps {
  /** Action du « + » pour la page courante (déterminée par AppLayout) */
  action: AddAction | null
  className?: string
}

const labels: Record<AddAction['kind'], string> = {
  'new-recipe': 'Nouvelle recette',
  'planche-photo': 'Ajouter une photo à la planche familiale',
}

/**
 * Bouton flottant « + » contextuel : une seule action par page, avec un
 * aria-label précis. Pages sans action (favoris, profil, fiche recette,
 * mode cuisson…) : aucun bouton.
 */
export function AddButton({ action, className }: AddButtonProps) {
  const navigate = useNavigate()

  if (!action) return null

  const current = action

  function handleClick() {
    if (current.kind === 'new-recipe') navigate('/recettes/nouvelle')
    else current.onOpen()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={labels[current.kind]}
      className={cn(
        'touch-target-lg fixed bottom-24 right-5 z-40 min-h-14 min-w-14 rounded-full bg-terra-dark text-creme shadow-soft',
        'flex items-center justify-center hover:bg-[#8f4525] active:scale-95 transition-colors',
        className,
      )}
    >
      <Plus size={28} strokeWidth={2.5} aria-hidden="true" />
    </button>
  )
}
