import { Trash2, UserCheck } from 'lucide-react'
import { familyPhotoUrl } from '@/services/familyTree'
import { cn } from '@/lib/utils'
import type { FamilyMember } from '@/lib/types'

interface FamilyTreeProps {
  members: FamilyMember[]
  /** ids des profils connectés de la famille (badge « membre connecté ») */
  connectedProfileIds: Set<string>
  onRemove?: (member: FamilyMember) => void
}

/**
 * Arbre générationnel de la famille : les aînés en haut, leurs enfants
 * en dessous, reliés par un fil (corde) dessiné — esthétique artisanale.
 * Sur mobile, chaque génération défile horizontalement.
 */
export function FamilyTree({ members, connectedProfileIds, onRemove }: FamilyTreeProps) {
  if (members.length === 0) return null

  const byGeneration = new Map<number, FamilyMember[]>()
  for (const member of members) {
    const list = byGeneration.get(member.generation) ?? []
    list.push(member)
    byGeneration.set(member.generation, list)
  }
  const generations = [...byGeneration.keys()].sort((a, b) => a - b)
  const byId = new Map(members.map((m) => [m.id, m]))

  return (
    <div className="space-y-0">
      {generations.map((generation, genIndex) => (
        <section key={generation} aria-label={`Génération ${generation}`}>
          {genIndex > 0 && (
            /* Fil horizontal qui relie les générations, comme une corde à linge */
            <div className="flex justify-center" aria-hidden="true">
              <span className="block w-1 h-8 border-l-2 border-dashed border-terra/60" />
            </div>
          )}
          <p className="kicker text-center mb-3">
            {generation === 1 ? 'Les aînés' : `Génération ${generation}`}
          </p>
          <div className="flex gap-4 overflow-x-auto pb-2 justify-start sm:justify-center snap-x">
            {(byGeneration.get(generation) ?? []).map((member) => {
              const parent = member.parent_id ? byId.get(member.parent_id) : null
              const isConnected = !!member.linked_profile_id && connectedProfileIds.has(member.linked_profile_id)
              const photo = familyPhotoUrl(member.photo_url)
              return (
                <div key={member.id} className="snap-start shrink-0 w-40">
                  {/* Fil vertical : le nœud pend au fil de son parent */}
                  {parent && (
                    <div className="flex flex-col items-center" aria-hidden="true">
                      <span className="block w-0.5 h-6 bg-terra/50" />
                      <span className="block w-2 h-2 rounded-full bg-terra/70 -mt-0.5" />
                    </div>
                  )}
                  <figure
                    className={cn(
                      'bg-white p-2.5 pb-3 rounded-md shadow-card w-full',
                      'border-b-4 border-[#6b4a32]',
                    )}
                    style={{ transform: `rotate(${(member.first_name.length % 2 === 0 ? 1 : -1) * 1.5}deg)` }}
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-sm bg-lin">
                      {photo ? (
                        <img
                          src={photo}
                          alt={`Photo de ${member.first_name} en cuisine`}
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="absolute inset-0 flex items-center justify-center font-serif font-bold text-3xl text-bleu"
                          role="img"
                          aria-label={`Pas de photo pour ${member.first_name}`}
                        >
                          {member.first_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {isConnected && (
                        <span
                          className="absolute top-1.5 right-1.5 inline-flex items-center gap-1 bg-creme/95 rounded-full px-2 py-1 text-[11px] font-extrabold text-bleu"
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
                        <p className="text-hand text-bleu text-lg leading-tight">{member.family_role}</p>
                      )}
                      {parent && (
                        <p className="text-xs text-encre-soft mt-0.5">
                          enfant de {parent.first_name}
                        </p>
                      )}
                    </figcaption>
                  </figure>
                  {onRemove && (
                    <div className="flex justify-center mt-1">
                      <button
                        type="button"
                        onClick={() => onRemove(member)}
                        aria-label={`Retirer ${member.first_name} de l'arbre`}
                        className="min-h-11 min-w-11 rounded-full text-encre-soft hover:text-carmine inline-flex items-center justify-center"
                      >
                        <Trash2 size={17} aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
