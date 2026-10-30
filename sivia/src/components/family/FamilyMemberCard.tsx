import { useState } from 'react'
import { Pencil, Trash2, UserCheck } from 'lucide-react'
import { familyPhotoUrl } from '@/services/familyTree'
import { type FamilyMember } from '@/lib/types'
import { cn } from '@/lib/utils'

interface FamilyMemberCardProps {
  member: FamilyMember
  /** Premier référent pour afficher le lien (tel qu'écrit par l'utilisateur) */
  parent?: FamilyMember | null
  /** Second référent (« relié aux deux ») */
  parent2?: FamilyMember | null
  /** ids des profils connectés de la famille (badge « membre connecté ») */
  connectedProfileIds: Set<string>
  /** Rotation du polaroïd, calculée par l'appelant */
  tilt: number
  onEdit?: (member: FamilyMember) => void
  onRemove?: (member: FamilyMember) => void
}

/**
 * Nœud de l'arbre : photo en pleine action dans la cuisine, polaroïd
 * avec pied brun, prénom, lien familial libre et lien typé vers le
 * référent (« cousine de mamie Jeanne »). Badge « connecté » si le
 * membre est lié à un compte Savia. Boutons d'édition et de retrait.
 */
export function FamilyMemberCard({
  member,
  parent,
  parent2,
  connectedProfileIds,
  tilt,
  onEdit,
  onRemove,
}: FamilyMemberCardProps) {
  // Confirmation douce avant retrait : plus de window.confirm bloquant
  const [confirming, setConfirming] = useState(false)
  const photo = familyPhotoUrl(member.photo_url)
  const isConnected = !!member.linked_profile_id && connectedProfileIds.has(member.linked_profile_id)
  // Lien tel qu'écrit par l'utilisateur, affiché sous la forme « <lien> <prénom du référent> »
  const relationLabel = member.relation_label?.trim()

  return (
    <div className="shrink-0 w-44 snap-start">
      <figure
        className={cn('polaroid relative w-full')}
        style={{ ['--r' as string]: `${tilt}deg` }}
      >
        <span className="epingle" aria-hidden="true" />
        <div className="relative aspect-square w-full overflow-hidden rounded-sm bg-papier">
          {photo ? (
            <img
              src={photo}
              alt={`Photo de ${member.first_name} en cuisine`}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center font-serif font-bold text-3xl text-encre-doux"
              role="img"
              aria-label={`Pas de photo pour ${member.first_name}`}
            >
              {member.first_name.charAt(0).toUpperCase()}
            </div>
          )}
          {isConnected && (
            <span
              className="absolute top-1.5 right-1.5 inline-flex items-center gap-1 bg-carte/95 rounded-full px-2 py-1 text-xs font-extrabold text-vert"
              title="Membre connecté à Savia"
            >
              <UserCheck size={13} aria-hidden="true" /> Connecté
            </span>
          )}
        </div>
        <figcaption className="text-center pt-2">
          <p className="font-serif font-bold text-encre leading-tight">
            {member.first_name}
            {member.last_name ? ` ${member.last_name}` : ''}
          </p>
          {member.family_role && (
            <p className="font-serif italic text-encre-doux text-2xl leading-tight">{member.family_role}</p>
          )}
          {parent && relationLabel && (
            <p className="text-sm text-encre-doux font-bold mt-0.5">
              {relationLabel} {parent.first_name}
              {parent2 ? ` et ${parent2.first_name}` : ''}
            </p>
          )}
        </figcaption>
      </figure>
      {(onEdit || onRemove) && (
        <div className="flex justify-center gap-1 mt-1">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(member)}
              aria-label={`Modifier ${member.first_name}`}
              className="touch-target-lg min-h-11 min-w-11 rounded-full text-encre-doux hover:text-vert inline-flex items-center justify-center"
            >
              <Pencil size={17} aria-hidden="true" />
            </button>
          )}
          {onRemove && !confirming && (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              aria-label={`Retirer ${member.first_name} de l'arbre`}
              className="touch-target-lg min-h-11 min-w-11 rounded-full text-encre-doux hover:text-tomate inline-flex items-center justify-center"
            >
              <Trash2 size={17} aria-hidden="true" />
            </button>
          )}
          {onRemove && confirming && (
            <button
              type="button"
              onClick={() => onRemove(member)}
              aria-label={`Confirmer : retirer ${member.first_name} de l'arbre`}
              className="min-h-11 px-3 rounded-full text-sm font-bold bg-tomate text-white inline-flex items-center justify-center"
            >
              Retirer de l'arbre ?
            </button>
          )}
        </div>
      )}
    </div>
  )
}
