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
  'family-member': "Ajouter un membre à l'arbre",
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
        'fixed bottom-22 right-5 z-40 w-14 h-14 rounded-full bg-terra text-creme shadow-soft',
        'flex items-center justify-center hover:bg-terra-dark active:scale-95 transition-colors',
        className,
      )}
    >
      <Plus size={28} strokeWidth={2.5} aria-hidden="true" />
    </button>
  )
}
