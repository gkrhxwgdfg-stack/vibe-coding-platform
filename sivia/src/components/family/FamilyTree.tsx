import { useEffect, useMemo, useRef, useState } from 'react'
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
  /** Recettes transmises par membre (id -> nombre) — fruits de l'arbre (§5.5) */
  recipeCountByMember?: Record<string, number>
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
 *   Les couples sont reliés par une ficelle de cuisine (Tape).
 * - « + » carmine en haut : ajouter un aîné au-dessus (les racines existantes
 *   deviennent ses enfants : elle passe au-dessus, l'arbre reste structuré).
 * - Coordonnées en pixels fournies par `buildFamilyTreeLayout` : aucune
 *   conversion ici. L'arbre est centré, les branches ne se chevauchent pas.
 */
export function FamilyTree({
  members,
  generations,
  recipeCountByMember,
  connectedProfileIds,
  onRemoveMember,
  onCreateMember,
  onUpdateMember,
}: FamilyTreeProps) {
  const layout = useMemo(() => buildFamilyTreeLayout(members), [members])
  const { nodes, segments, width, height } = layout

  const [modalOpen, setModalOpen] = useState(false)
  // Centrage automatique du canevas : quand l'arbre grandit (ajout d'une
  // personne hors couple), la vue reste centrée sur l'arbre, pas à gauche.
  const canvasRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = canvasRef.current?.parentElement
    if (el) el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2)
  }, [width, height])
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)
  const [prefillParentId, setPrefillParentId] = useState<string | null>(null)
  const [prefillParent2Id, setPrefillParent2Id] = useState<string | null>(null)
  const [prefillLinkKind, setPrefillLinkKind] = useState<'parent' | 'partner' | null>(null)

  const { CARD_W, PLUS_H, TOP_PAD } = TREE_GEOMETRY
  // Hauteur de la capsule « couple » : couvre carte + légende + boutons
  const COUPLE_FRAME_H = 330

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
      <div className="relative mx-auto" style={{ width, height }} ref={canvasRef}>
        {/* ---------- L'arbre line-art (SVG derrière les cartes) ----------
            Refonte visuelle : plus aucune barre orthogonale.
            - Branches : courbes cubiques CONTINUES du bas d'une carte
              au haut de l'autre (tunnel vertical doux, léger sway) —
              aucune jonction, donc aucun angle droit ni coupure.
            - Couples : une même « frame » douce (capsule floue vert-clair)
              relie les deux cartes — le couple appartient à une seule
              bulle, la ficelle floue cannelle au centre.
            - Feuillage : une canopée par groupe, pas par carte.
            - Membres = feuilles, recettes transmises = fruits (§5.5). */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          aria-hidden="true"
        >
          {/* Frames de couple : capsule douce derrière les deux cartes */}
          {segments
            .filter((seg) => seg.kind === 'couple')
            .map((seg, i) => (
              <rect
                key={`frame-${i}`}
                x={seg.x1 - 14}
                y={seg.y1 - COUPLE_FRAME_H / 2}
                width={seg.x2 - seg.x1 + 28}
                height={COUPLE_FRAME_H}
                rx={26}
                fill="#2e5939"
                fillOpacity={0.1}
              />
            ))}
          {/* Branches organiques parent → enfant : cubiques continues */}
          {segments
            .filter((seg) => seg.kind !== 'couple')
            .map((seg, i) => {
              const dy = seg.y2 - seg.y1
              const sway = (i % 2 === 0 ? 1 : -1) * 6
              const c1x = seg.x1 + sway
              const c1y = seg.y1 + dy * 0.45
              const c2x = seg.x2 + sway
              const c2y = seg.y2 - dy * 0.45
              return (
                <path
                  key={`branche-${i}`}
                  d={`M ${seg.x1} ${seg.y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${seg.x2} ${seg.y2}`}
                  stroke="#8a5a2b"
                  strokeWidth={4.5}
                  strokeLinecap="round"
                  fill="none"
                  opacity={0.85}
                />
              )
            })}
          {/* Fruits : recettes transmises par chaque membre */}
          {nodes.flatMap((node) => {
            const count = Math.min(recipeCountByMember?.[node.member.id] ?? 0, 3)
            return Array.from({ length: count }).map((_, j) => (
              <circle
                key={`fruit-${node.member.id}-${j}`}
                cx={node.x + CARD_W - 8 + j * 10}
                cy={node.y + 56 + (j % 2) * 12}
                r={7}
                fill={j % 2 === 0 ? '#c93a2b' : '#e4a93c'}
                fillOpacity={0.85}
              />
            ))
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
                'touch-target-lg min-h-11 min-w-11 rounded-full bg-carte border-2 border-tomate text-tomate',
                'inline-flex items-center justify-center hover:bg-tomate hover:text-white transition-colors',
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
                    'touch-target-lg min-h-11 min-w-11 rounded-full bg-carte border-2 border-vert text-vert',
                    'inline-flex items-center justify-center hover:bg-vert hover:text-white transition-colors',
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
              className="touch-target-lg min-h-13 px-6 py-3 rounded-full bg-tomate text-white font-bold inline-flex items-center gap-2 hover:bg-[#a72f23]"
            >
              <Plus size={22} aria-hidden="true" /> Créer la base de l'arbre
            </button>
          </div>
        )}
      </div>

      {/* Légende */}
      <p className="text-sm text-encre-doux text-center mt-2">
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
