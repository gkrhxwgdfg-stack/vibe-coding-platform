import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { buildFamilyTreeLayout, TREE_GEOMETRY, type TreeNode } from '@/lib/familyTreeLayout'
import { FamilyMemberCard } from '@/components/family/FamilyMemberCard'
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
      relation_label: string | null
      linked_profile_id: string | null
      photoFile: File | null
      removePhoto?: boolean
    },
  ) => Promise<{ error: string | null }>
}

/**
 * Arbre généalogique piloté par un « + » unique par personne.
 *
 * - L'arbre DESCEND de génération en génération : les aînés (la base) sont
 *   en haut, les jeunes en dessous. Lecture naturelle de la page.
 * - Chaque personne porte UN « + » sous sa carte : cliquer accroche une
 *   nouvelle personne reliée à elle (enfant = branche vers le bas, conjoint =
 *   branche horizontale — déduit du lien écrit librement).
 * - Un « + » carmine en haut de l'arbre permet d'ajouter une nouvelle base
 *   (un aîné) au-dessus, si la première personne ajoutée n'était pas le
 *   début de l'arbre.
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

  const { CARD_W, PLUS_H, TOP_PAD } = TREE_GEOMETRY

  function tiltFor(member: FamilyMember, index: number): number {
    const seed = member.first_name.length + index
    return (seed % 2 === 0 ? 1 : -1) * (1 + (seed % 3) * 0.75)
  }

  function openAdd(parentId: string | null, parent2Id: string | null = null) {
    setEditingMember(null)
    setPrefillParentId(parentId)
    setPrefillParent2Id(parent2Id)
    setModalOpen(true)
  }

  function openEdit(member: FamilyMember) {
    setPrefillParentId(null)
    setPrefillParent2Id(null)
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
          {segments.map((seg, i) => {
            if (seg.kind === 'couple') {
              const midX = (seg.x1 + seg.x2) / 2
              const midY = (seg.y1 + seg.y2) / 2
              return (
                <g key={i} filter="url(#corde-relief)">
                  <line x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2} stroke="#c4643a" strokeWidth={3} strokeLinecap="round" />
                  <circle cx={midX} cy={midY} r={5} fill="#b33b3b" stroke="#fbf6ec" strokeWidth={2} />
                </g>
              )
            }
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
                'min-h-11 min-w-11 rounded-full bg-creme border-2 border-carmine text-carmine',
                'inline-flex items-center justify-center hover:bg-carmine hover:text-creme transition-colors shadow-card',
              )}
            >
              <Plus size={20} strokeWidth={2.5} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* ---------- Nœuds + « + » unique sous chaque carte ---------- */}
        {nodes.map((node: TreeNode, index: number) => {
          const member = node.member
          const parent = member.parent_id
            ? members.find((m) => m.id === member.parent_id)
            : null
          const parent2 = member.parent2_id
            ? members.find((m) => m.id === member.parent2_id)
            : null
          return (
            <div
              key={member.id}
              className="absolute"
              style={{ left: node.x, top: node.y, width: CARD_W }}
            >
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
                    'min-h-11 min-w-11 rounded-full bg-creme border-2 border-terra text-terra',
                    'inline-flex items-center justify-center hover:bg-terra hover:text-creme transition-colors shadow-card',
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
              className="min-h-13 px-6 py-3 rounded-full bg-terra text-creme font-bold inline-flex items-center gap-2 shadow-soft hover:bg-terra-dark"
            >
              <Plus size={22} aria-hidden="true" /> Créer la base de l'arbre
            </button>
          </div>
        )}
      </div>

      {/* Légende */}
      <p className="text-xs text-brun-soft text-center mt-2">
        « + » sous une personne : ajouter quelqu'un relié à elle (l'arbre descend) · « + » carmine
        en haut : ajouter un aîné au-dessus
      </p>

      {/* Modal interne : création via « + » (pré-rempli) ou édition */}
      <FamilyMemberModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingMember(null)
          setPrefillParentId(null)
          setPrefillParent2Id(null)
        }}
        member={editingMember}
        generations={generations}
        treeMembers={members}
        prefillParentId={prefillParentId}
        prefillParent2Id={prefillParent2Id}
        onCreate={onCreateMember}
        onUpdate={onUpdateMember}
      />
    </div>
  )
}
