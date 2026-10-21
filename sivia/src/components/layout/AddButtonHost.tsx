import { useState } from 'react'
import { AddButton } from '@/components/layout/AddButton'
import { useAddAction } from '@/hooks/useAddAction'
import { AddPhotoModal } from '@/components/planche/AddPhotoModal'
import { useRecentComments } from '@/hooks/useComments'

/**
 * Hôte du bouton « + » contextuel : monte le bouton dans la coque de
 * navigation et ouvre le modal de la page courante. La page Famille n'a
 * plus de « + » flottant : l'arbre a ses propres « + » et scotchs.
 */
export function AddButtonHost() {
  const [plancheOpen, setPlancheOpen] = useState(false)
  const { refetch } = useRecentComments(5)

  const action = useAddAction(() => setPlancheOpen(true))

  if (!action) return null

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
