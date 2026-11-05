import { useState } from 'react'
import { AddButton } from '@/components/layout/AddButton'
import { useAddAction } from '@/hooks/useAddAction'
import { AddPhotoModal } from '@/components/planche/AddPhotoModal'
import { useRecentComments } from '@/hooks/useComments'
import { useFamillePlan } from '@/hooks/useFamillePlan'

/**
 * Hôte du bouton « + » contextuel : monte le bouton dans la coque de
 * navigation et ouvre le modal de la page courante. La page Famille n'a
 * plus de « + » flottant : l'arbre a ses propres « + » et scotchs.
 */
export function AddButtonHost() {
  const [plancheOpen, setPlancheOpen] = useState(false)
  const { refetch } = useRecentComments(5)
  const { premium } = useFamillePlan()

  const action = useAddAction(() => setPlancheOpen(true))

  // Sans Sivia Famille, l'accueil n'offre plus de « + » : la planche est un extra
  if (!action || (action.kind === 'planche-photo' && !premium)) return null

  return (
    <>
      <AddButton action={action} />
      {action.kind === 'planche-photo' && (
        <AddPhotoModal
          open={plancheOpen}
          onClose={() => setPlancheOpen(false)}
          onPublished={refetch}
        />
      )}
    </>
  )
}
