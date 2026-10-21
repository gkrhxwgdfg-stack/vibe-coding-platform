import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { buildFamilyTreeLayout, type TreeNode } from '@/lib/familyTreeLayout'
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
 * - L'arbre MONTE de génération en génération : les aînés (la base) sont
 *   en bas, les jeunes en haut. On le lit comme on remonte le temps.
 * - Chaque personne porte UN « + » à sa sortie : cliquer accroche une
 *   nouvelle personne reliée à elle (enfant = branche montante, conjoint =
 *   branche horizontale — déduit du lien écrit librement).
 * - Un « + » en bas de l'arbre permet d'ajouter une base en dessous
 *   (« descendre ») si la première personne ajoutée n'est pas le début.
 * - L'arbre est centré horizontalement ; les branches se décalent au fur
 *   et à mesure, sans trous.
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
  const { nodes, segments, rows, offsetX } = layout

  const [modalOpen, setModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)
  const [prefillParentId, setPrefillParentId] = useState<string | null>(null)
  const [prefillParent2Id, setPrefillParent2Id] = useState<string | null>(null)

  // Géométrie
  const CARD_W = 176
  const CARD_H = 240
  const PITCH_X = CARD_W + 36
  const PITCH_Y = 280
  const columns = Math.max(...nodes.map((n) => n.x), 0) + 1
  const width = Math.max(columns * PITCH_X + CARD_W, 340)
  const height = Math.max(rows * PITCH_Y + CARD_H + 80, 420) // +80 pour le « + » du bas

  // y logique : 0 = aînés (base). Affichage inversé : les aînés en bas.
  const centerX = (x: number) => (x + offsetX) * PITCH_X + CARD_W / 2 + PITCH_X / 2
  const topY = (y: number) => (rows - 1 - y) * PITCH_Y

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

  // Position du « + » du bas (descendre) : sous la base, centrée
  const basePlusX = width / 2
  const basePlusY = (rows - 1) * PITCH_Y + CARD_H + 16

  return (
    <div
      className="overflow-auto -mx-2 px-2 pb-2 max-h-[70dvh]"
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
            // Inversion verticale des coordonnées de la corde aussi
            const x1 = (seg.x1 + offsetX) * PITCH_X + PITCH_X / 2
            const x2 = (seg.x2 + offsetX) * PITCH_X + PITCH_X / 2
            const y1 = (rows - 1 - seg.y1) * PITCH_Y + CARD_H / 2
            const y2 = (rows - 1 - seg.y2) * PITCH_Y + CARD_H / 2
            if (seg.kind === 'couple') {
              const midX = (x1 + x2) / 2
              const midY = (y1 + y2) / 2
              return (
                <g key={i} filter="url(#corde-relief)">
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#c4643a" strokeWidth={3} strokeLinecap="round" />
                  <circle cx={midX} cy={midY} r={5} fill="#b33b3b" stroke="#fbf6ec" strokeWidth={2} />
                </g>
              )
            }
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#c4643a"
                strokeWidth={seg.kind === 'horizontal' ? 3 : 2.5}
                strokeLinecap="round"
                filter="url(#corde-relief)"
                opacity={0.85}
              />
            )
          })}
        </svg>

        {/* ---------- Nœuds + « + » unique ---------- */}
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
              style={{
                left: centerX(node.x) - CARD_W / 2,
                top: topY(node.y),
                width: CARD_W,
              }}
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

              {/* « + » unique à la sortie du nœud : accroche une personne reliée */}
              <div className="flex items-center justify-center mt-1">
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

        {/* ---------- « + » du bas : ajouter une base en dessous (descendre) ---------- */}
        <div className="absolute" style={{ left: basePlusX - 22, top: basePlusY }}>
          <button
            type="button"
            onClick={() => openAdd(null)}
            aria-label="Ajouter une personne en dessous — nouvelle base de l'arbre"
            title="Ajouter une base en dessous (l'arbre descend)"
            className={cn(
              'min-h-11 min-w-11 rounded-full bg-creme border-2 border-carmine text-carmine',
              'inline-flex items-center justify-center hover:bg-carmine hover:text-creme transition-colors shadow-card',
            )}
          >
            <Plus size={20} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>

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
        « + » sous une personne : ajouter quelqu'un relié à elle (l'arbre monte) · « + » carmine
        en bas : ajouter une base en dessous (l'arbre descend)
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
