import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { buildFamilyTreeLayout, TREE_GEOMETRY, type TreeNode } from '@/lib/familyTreeLayout'
import { FamilyMemberCard } from '@/components/family/FamilyMemberCard'
import { Tape, TapeAddButton } from '@/components/family/Tape'
import { FamilyMemberModal } from '@/components/family/FamilyMemberModal'
import type { FamilyGeneration, FamilyMember } from '@/lib/types'
import { cn } from '@/lib/utils'

interface FamilyTreeProps {
  members: FamilyMember[]
  generations: FamilyGeneration[]
  /** ids des profils connectés de la famille (badge « membre connecté ») */
  connectedProfileIds: Set<string>
  onRemoveMember?: (member: FamilyMember) => void
  onCreateMember: (values: {
    first_name: string
    last_name: string
    family_role: string
    generation_id: string | null
    parent_id: string | null
    parent2_id: string | null
    link_kind: 'parent' | 'partner' | null
    relation_label: string | null
    linked_profile_id: string | null
    photoFile: File | null
  }) => Promise<{ error: string | null }>
  onUpdateMember: (
    memberId: string,
    values: {
      first_name: string
      last_name: string
      family_role: string
      generation_id: string | null
      parent_id: string | null
      parent2_id: string | null
      link_kind: 'parent' | 'partner' | null
      relation_label: string | null
      linked_profile_id: string | null
      photoFile: File | null
      removePhoto?: boolean
    },
  ) => Promise<{ error: string | null }>
}

/**
 * Arbre généalogique piloté par des « + » et des scotchs.
 *
 * - L'arbre DESCEND de génération en génération : les aînés (la base) sont
 *   en haut, les jeunes en dessous. La génération de chacun est calculée
 *   UNIQUEMENT à partir des liens (jamais d'une génération nommée).
 * - « + » sous une carte : ajouter un ENFANT en dessous.
 * - Scotch « + » sur le bord droit d'une carte sans partenaire : ajouter un
 *   PARTENAIRE à côté (même génération — conjoint·e, copine, pacsé·e…).
 *   Les couples sont « scotchés » ensemble par un vrai ruban adhésif (Tape).
 * - « + » carmine en haut : ajouter un aîné au-dessus (les racines existantes
 *   deviennent ses enfants : elle passe au-dessus, l'arbre reste structuré).
 * - Coordonnées en pixels fournies par `buildFamilyTreeLayout` : aucune
 *   conversion ici. L'arbre est centré, les branches ne se chevauchent pas.
 */
export function FamilyTree({
  members,
  generations,
  connectedProfileIds,
  onRemoveMember,
  onCreateMember,
  onUpdateMember,
}: FamilyTreeProps) {
  const layout = useMemo(() => buildFamilyTreeLayout(members), [members])
  const { nodes, segments, width, height } = layout

  const [modalOpen, setModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)
  const [prefillParentId, setPrefillParentId] = useState<string | null>(null)
  const [prefillParent2Id, setPrefillParent2Id] = useState<string | null>(null)
  const [prefillLinkKind, setPrefillLinkKind] = useState<'parent' | 'partner' | null>(null)

  const { CARD_W, PLUS_H, TOP_PAD } = TREE_GEOMETRY

  function tiltFor(member: FamilyMember, index: number): number {
    const seed = member.first_name.length + index
    return (seed % 2 === 0 ? 1 : -1) * (1 + (seed % 3) * 0.75)
  }

  function openAdd(
    parentId: string | null,
    parent2Id: string | null = null,
    linkKind: 'parent' | 'partner' | null = null,
  ) {
    setEditingMember(null)
    setPrefillParentId(parentId)
    setPrefillParent2Id(parent2Id)
    setPrefillLinkKind(linkKind)
    setModalOpen(true)
  }

  function openEdit(member: FamilyMember) {
    setPrefillParentId(null)
    setPrefillParent2Id(null)
    setPrefillLinkKind(null)
    setEditingMember(member)
    setModalOpen(true)
  }

  // Position du « + » carmine du haut (ajouter un aîné au-dessus de l'arbre)
  const topPlusX = width / 2 - 22
  const topPlusY = TOP_PAD / 2 - 22

  return (
    <div
      className="overflow-auto -mx-2 px-2 pb-2 max-h-[75dvh]"
      role="group"
      aria-label="Arbre généalogique de la famille"
    >
      <div className="relative mx-auto" style={{ width, height }}>
        {/* ---------- Corde (SVG derrière les cartes) ---------- */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          aria-hidden="true"
        >
          <defs>
            <filter id="corde-relief" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodColor="#4a3728" floodOpacity="0.35" />
            </filter>
          </defs>
          {segments
            .filter((seg) => seg.kind !== 'couple') // le scotch couple est en HTML (Tape)
            .map((seg, i) => {
            return (
              <line
                key={i}
                x1={seg.x1}
                y1={seg.y1}
                x2={seg.x2}
                y2={seg.y2}
                stroke="#c4643a"
                strokeWidth={seg.kind === 'horizontal' ? 3 : 2.5}
                strokeLinecap="round"
                filter="url(#corde-relief)"
                opacity={0.85}
              />
            )
            })}
        </svg>

        {/* ---------- « + » carmine du haut : ajouter un aîné au-dessus ---------- */}
        {nodes.length > 0 && (
          <div className="absolute" style={{ left: topPlusX, top: topPlusY }}>
            <button
              type="button"
              onClick={() => openAdd(null)}
              aria-label="Ajouter une personne au-dessus — nouvelle base de l'arbre"
              title="Ajouter une base au-dessus (l'arbre descend)"
              className={cn(
                'touch-target-lg min-h-11 min-w-11 rounded-full bg-creme border-2 border-carmine text-carmine',
                'inline-flex items-center justify-center hover:bg-carmine hover:text-creme transition-colors shadow-card',
              )}
            >
              <Plus size={20} strokeWidth={2.5} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* ---------- Scotchs entre les cartes des couples ---------- */}
        {segments
          .filter((seg) => seg.kind === 'couple')
          .map((seg, i) => (
            <Tape key={`tape-${i}`} x={seg.x1} y={seg.y1 - 13} width={seg.x2 - seg.x1} />
          ))}

        {/* ---------- Nœuds + « + » unique sous chaque carte ---------- */}
        {nodes.map((node: TreeNode, index: number) => {
          const member = node.member
          const parent = member.parent_id
            ? members.find((m) => m.id === member.parent_id)
            : null
          const parent2 = member.parent2_id
            ? members.find((m) => m.id === member.parent2_id)
            : null
          const hasPartner = !!node.coupleId
          return (
            <div
              key={member.id}
              className="absolute"
              style={{ left: node.x, top: node.y, width: CARD_W }}
            >
              {!hasPartner && (
                <TapeAddButton
                  memberName={member.first_name}
                  onClick={() => openAdd(member.id, null, 'partner')}
                />
              )}
              <FamilyMemberCard
                member={member}
                parent={parent}
                parent2={parent2}
                connectedProfileIds={connectedProfileIds}
                tilt={tiltFor(member, index)}
                onEdit={() => openEdit(member)}
                onRemove={onRemoveMember ? () => onRemoveMember(member) : undefined}
              />

              {/* « + » unique sous la carte : accroche une personne reliée */}
              <div className="flex items-center justify-center mt-1" style={{ height: PLUS_H }}>
                <button
                  type="button"
                  onClick={() => openAdd(member.id)}
                  aria-label={`Ajouter une personne reliée à ${member.first_name}`}
                  title={`Ajouter une personne reliée à ${member.first_name}`}
                  className={cn(
                    'touch-target-lg min-h-11 min-w-11 rounded-full bg-creme border-2 border-terra text-terra',
                    'inline-flex items-center justify-center hover:bg-terra-dark hover:text-creme transition-colors shadow-card',
                  )}
                >
                  <Plus size={20} strokeWidth={2.5} aria-hidden="true" />
                </button>
              </div>
            </div>
          )
        })}

        {/* Arbre vide : « + » central pour créer la base */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              type="button"
              onClick={() => openAdd(null)}
              className="touch-target-lg min-h-13 px-6 py-3 rounded-full bg-terra-dark text-creme font-bold inline-flex items-center gap-2 shadow-soft hover:bg-[#8f4525]"
            >
              <Plus size={22} aria-hidden="true" /> Créer la base de l'arbre
            </button>
          </div>
        )}
      </div>

      {/* Légende */}
      <p className="text-sm text-brun-soft text-center mt-2">
        « + » sous une personne : ajouter un enfant en dessous · scotch « + » sur le côté : ajouter un
        partenaire à côté · « + » carmine en haut : ajouter un aîné au-dessus
      </p>

      {/* Modal interne : création via « + » (pré-rempli) ou édition */}
      <FamilyMemberModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingMember(null)
          setPrefillParentId(null)
          setPrefillParent2Id(null)
          setPrefillLinkKind(null)
        }}
        member={editingMember}
        generations={generations}
        treeMembers={members}
        prefillParentId={prefillParentId}
        prefillParent2Id={prefillParent2Id}
        prefillLinkKind={prefillLinkKind}
        onCreate={onCreateMember}
        onUpdate={onUpdateMember}
      />
    </div>
  )
}
