import { useState } from 'react'
import { AddButton } from '@/components/layout/AddButton'
import { useAddAction } from '@/hooks/useAddAction'
import { AddPhotoModal } from '@/components/planche/AddPhotoModal'
import { AddFamilyMemberModal } from '@/components/family/AddFamilyMemberModal'
import { useRecentComments } from '@/hooks/useComments'

/**
 * Hôte du bouton « + » contextuel : monte le bouton dans la coque de
 * navigation et ouvre les modaux de la page courante (planche familiale,
 * arbre généalogique). Les modaux vivent ici pour rester indépendants des
 * pages qu'ils complètent.
 */
export function AddButtonHost() {
  const [plancheOpen, setPlancheOpen] = useState(false)
  const [memberOpen, setMemberOpen] = useState(false)
  const { refetch } = useRecentComments(5)

  const action = useAddAction(
    () => setPlancheOpen(true),
    () => setMemberOpen(true),
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
      {action.kind === 'family-member' && (
        <AddFamilyMemberModal open={memberOpen} onClose={() => setMemberOpen(false)} />
      )}
    </>
  )
}
