import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AddButton } from '@/components/layout/AddButton'
import { useAddAction } from '@/hooks/useAddAction'
import { AddPhotoModal } from '@/components/planche/AddPhotoModal'
import { useRecentComments } from '@/hooks/useComments'

/**
 * Hôte du bouton « + » contextuel : monte le bouton dans la coque de
 * navigation et ouvre les modaux de la page courante. Sur la page Famille,
 * le « + » renvoie vers la section arbre (le modal d'ajout de membre y vit,
 * avec les générations et les référents).
 */
export function AddButtonHost() {
  const [plancheOpen, setPlancheOpen] = useState(false)
  const navigate = useNavigate()
  const { refetch } = useRecentComments(5)

  const action = useAddAction(
    () => setPlancheOpen(true),
    () => navigate('/famille', { state: { openAddMember: true } }),
  )

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
