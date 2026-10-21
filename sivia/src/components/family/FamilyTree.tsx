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
  onEditMember?: (member: FamilyMember) => void
  onRemoveMember?: (member: FamilyMember) => void
  /** Création d'un membre (déléguée au modal interne) */
  onCreateMember: (values: {
    first_name: string
    last_name: string
    family_role: string
    generation_id: string | null
    parent_id: string | null
    relation_label: string | null
    linked_profile_id: string | null
    photoFile: File | null
  }) => Promise<{ error: string | null }>
  /** Édition d'un membre (déléguée au modal interne) */
  onUpdateMember: (
    memberId: string,
    values: {
      first_name: string
      last_name: string
      family_role: string
      generation_id: string | null
      parent_id: string | null
      relation_label: string | null
      linked_profile_id: string | null
      photoFile: File | null
      removePhoto?: boolean
    },
  ) => Promise<{ error: string | null }>
}

/** Position d'un « + » d'ajout de branche, en coordonnées relatives de l'arbre */
type AddSlot =
  | { kind: 'root' } // nouvelle racine (tout en haut)
  | { kind: 'child'; parent: FamilyMember } // enfant du membre (branche descendante)
  | { kind: 'partner'; partner: FamilyMember } // conjoint du membre (branche horizontale)

/**
 * Vrai arbre généalogique, piloté par des « + » :
 *
 * - Une base est créée (premier membre = racine, tout en haut).
 * - Chaque nœud porte un « + » contextuel à sa sortie : selon l'endroit où
 *   on clique, le nouveau membre s'accroche comme **enfant** (branche
 *   descendante) ou comme **conjoint** (branche horizontale).
 * - Pas de menu déroulant de liens : un champ libre « lien avec cette
 *   personne » (l'utilisateur écrit ce qu'il veut : « fils de », « marié à »,
 *   « recueilli par »…).
 * - La corde est dessinée en SVG avec relief (ombre portée) ; les couples
 *   sont reliés par un trait avec un point carmine.
 * - Défilement horizontal + vertical sur mobile.
 */
export function FamilyTree({
  members,
  generations,
  connectedProfileIds,
  onEditMember,
  onRemoveMember,
  onCreateMember,
  onUpdateMember,
}: FamilyTreeProps) {
  const layout = useMemo(() => buildFamilyTreeLayout(members), [members])
  const { nodes, segments, columns, rows } = layout

  // Modal interne : création via un « + » (pré-rempli) ou édition (crayon)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)
  const [prefill, setPrefill] = useState<{
    parent_id: string | null
    link_kind: 'parent' | 'partner' | null
  } | null>(null)

  // Géométrie
  const CARD_W = 176
  const CARD_H = 240
  const PITCH_X = CARD_W + 36
  const PITCH_Y = 280
  const width = Math.max(columns * PITCH_X + CARD_W, 340)
  const height = Math.max(rows * PITCH_Y + CARD_H, 340)
  const centerX = (x: number) => x * PITCH_X + CARD_W / 2
  const topY = (y: number) => y * PITCH_Y

  function tiltFor(member: FamilyMember, index: number): number {
    const seed = member.first_name.length + index
    return (seed % 2 === 0 ? 1 : -1) * (1 + (seed % 3) * 0.75)
  }

  function openAdd(slot: AddSlot) {
    setEditingMember(null)
    if (slot.kind === 'root') {
      setPrefill({ parent_id: null, link_kind: null })
    } else if (slot.kind === 'child') {
      setPrefill({ parent_id: slot.parent.id, link_kind: 'parent' })
    } else {
      setPrefill({ parent_id: slot.partner.id, link_kind: 'partner' })
    }
    setModalOpen(true)
  }

  function openEdit(member: FamilyMember) {
    setPrefill(null)
    if (onEditMember) {
      onEditMember(member)
    } else {
      setEditingMember(member)
      setModalOpen(true)
    }
  }

  // Le layout sait quels membres ont déjà un conjoint (pour ne proposer
  // le « + conjoint » que quand la place est libre)
  const hasPartner = useMemo(() => {
    const set = new Set<string>()
    for (const node of nodes) {
      if (node.coupleId) {
        // les deux membres du couple sont déjà reliés
        const coupleMembers = nodes.filter((n) => n.coupleId === node.coupleId)
        for (const cm of coupleMembers) set.add(cm.member.id)
      }
    }
    return set
  }, [nodes])

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
            const x1 = seg.x1 * PITCH_X + CARD_W / 2
            const x2 = seg.x2 * PITCH_X + CARD_W / 2
            const y1 = seg.y1 * PITCH_Y + CARD_H / 2
            const y2 = seg.y2 * PITCH_Y + CARD_H / 2
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

        {/* ---------- Nœuds + « + » contextuels ---------- */}
        {nodes.map((node: TreeNode, index: number) => {
          const member = node.member
          const parent = member.parent_id
            ? members.find((m) => m.id === member.parent_id)
            : null
          const cx = centerX(node.x)
          const ty = topY(node.y)
          const canAddPartner = !hasPartner.has(member.id)
          return (
            <div
              key={member.id}
              className="absolute"
              style={{ left: cx - CARD_W / 2, top: ty, width: CARD_W }}
            >
              <FamilyMemberCard
                member={member}
                parent={parent}
                connectedProfileIds={connectedProfileIds}
                tilt={tiltFor(member, index)}
                onEdit={() => openEdit(member)}
                onRemove={onRemoveMember ? () => onRemoveMember(member) : undefined}
              />

              {/* « + » à la sortie du nœud : enfant (en dessous) et conjoint (à droite) */}
              <div className="flex items-center justify-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => openAdd({ kind: 'child', parent: member })}
                  aria-label={`Ajouter un enfant de ${member.first_name}`}
                  title={`Ajouter un enfant de ${member.first_name}`}
                  className={cn(
                    'min-h-11 min-w-11 rounded-full bg-creme border-2 border-terra text-terra',
                    'inline-flex items-center justify-center hover:bg-terra hover:text-creme transition-colors shadow-card',
                  )}
                >
                  <Plus size={20} strokeWidth={2.5} aria-hidden="true" />
                  <span className="sr-only">enfant</span>
                </button>
                {canAddPartner && (
                  <button
                    type="button"
                    onClick={() => openAdd({ kind: 'partner', partner: member })}
                    aria-label={`Ajouter le conjoint de ${member.first_name}`}
                    title={`Ajouter le conjoint de ${member.first_name}`}
                    className={cn(
                      'min-h-11 min-w-11 rounded-full bg-creme border-2 border-carmine text-carmine',
                      'inline-flex items-center justify-center hover:bg-carmine hover:text-creme transition-colors shadow-card',
                    )}
                  >
                    <Plus size={20} strokeWidth={2.5} aria-hidden="true" />
                    <span className="sr-only">conjoint</span>
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {/* « + » racine : créer la base quand l'arbre est vide, ou une nouvelle branche libre */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              type="button"
              onClick={() => openAdd({ kind: 'root' })}
              className="min-h-13 px-6 py-3 rounded-full bg-terra text-creme font-bold inline-flex items-center gap-2 shadow-soft hover:bg-terra-dark"
            >
              <Plus size={22} aria-hidden="true" /> Créer la base de l'arbre
            </button>
          </div>
        )}
      </div>

      {/* Légende */}
      <p className="text-xs text-brun-soft text-center mt-2">
        « + » terracotta : ajouter un enfant (branche vers le bas) · « + » carmine : ajouter un
        conjoint (branche horizontale)
      </p>

      {/* Modal interne : création via « + » (pré-rempli) ou édition */}
      <FamilyMemberModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingMember(null)
          setPrefill(null)
        }}
        member={editingMember}
        generations={generations}
        treeMembers={members}
        prefillParentId={prefill?.parent_id ?? null}
        prefillLinkKind={prefill?.link_kind ?? null}
        onCreate={onCreateMember}
        onUpdate={onUpdateMember}
      />
    </div>
  )
}
