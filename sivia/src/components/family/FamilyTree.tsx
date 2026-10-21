import { useMemo } from 'react'
import { buildFamilyTreeLayout, type TreeSegment } from '@/lib/familyTreeLayout'
import { FamilyMemberCard } from '@/components/family/FamilyMemberCard'
import type { FamilyMember } from '@/lib/types'

interface FamilyTreeProps {
  members: FamilyMember[]
  /** ids des profils connectés de la famille (badge « membre connecté ») */
  connectedProfileIds: Set<string>
  onEditMember?: (member: FamilyMember) => void
  onRemoveMember?: (member: FamilyMember) => void
}

/**
 * Vrai arbre généalogique : construit à partir des liens entre personnes.
 * - « fils / fille de » → branche descendante (fratrie sous une barre)
 * - « conjoint·e de » → branche horizontale (trait entre les deux époux)
 *
 * La disposition est calculée par `buildFamilyTreeLayout` (logique pure) ;
 * la corde est dessinée en SVG derrière les cartes, avec du relief
 * (ombre portée, deux tons). Défilement horizontal sur mobile.
 */
export function FamilyTree({
  members,
  connectedProfileIds,
  onEditMember,
  onRemoveMember,
}: FamilyTreeProps) {
  const layout = useMemo(() => buildFamilyTreeLayout(members), [members])

  const { nodes, segments, columns, rows } = layout

  // Géométrie : une carte fait ~ 11rem (176px), la rangée ~ 15rem (240px)
  const CARD_W = 176
  const CARD_H = 240
  const PITCH_X = CARD_W + 28
  const PITCH_Y = 260

  const width = Math.max(columns * PITCH_X + CARD_W, 320)
  const height = Math.max(rows * PITCH_Y + CARD_H, 320)

  // Position du centre haut d'une carte (x + 0.5, y) en pixels
  const centerX = (x: number) => x * PITCH_X + CARD_W / 2
  const topY = (y: number) => y * PITCH_Y

  function tiltFor(member: FamilyMember, index: number): number {
    const seed = member.first_name.length + index
    return (seed % 2 === 0 ? 1 : -1) * (1 + (seed % 3) * 0.75)
  }

  return (
    <div
      className="overflow-x-auto -mx-2 px-2 pb-2"
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
            {/* Ombre portée de la corde pour le relief */}
            <filter id="corde-relief" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodColor="#4a3728" floodOpacity="0.35" />
            </filter>
          </defs>
          {segments.map((seg: TreeSegment, i: number) => {
            const x1 = seg.x1 * PITCH_X + CARD_W / 2
            const x2 = seg.x2 * PITCH_X + CARD_W / 2
            const y1 = seg.y1 * PITCH_Y + CARD_H / 2
            const y2 = seg.y2 * PITCH_Y + CARD_H / 2
            if (seg.kind === 'couple') {
              // Trait horizontal entre conjoints, avec un point carmine au milieu
              const midX = (x1 + x2) / 2
              const midY = (y1 + y2) / 2
              return (
                <g key={i} filter="url(#corde-relief)">
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#c4643a"
                    strokeWidth={3}
                    strokeLinecap="round"
                  />
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

        {/* ---------- Nœuds (cartes polaroïd) ---------- */}
        {nodes.map((node, index) => {
          const parent = node.member.parent_id
            ? members.find((m) => m.id === node.member.parent_id)
            : null
          return (
            <div
              key={node.member.id}
              className="absolute"
              style={{
                left: centerX(node.x) - CARD_W / 2,
                top: topY(node.y),
                width: CARD_W,
              }}
            >
              <FamilyMemberCard
                member={node.member}
                parent={parent}
                connectedProfileIds={connectedProfileIds}
                tilt={tiltFor(node.member, index)}
                onEdit={onEditMember}
                onRemove={onRemoveMember}
              />
            </div>
          )
        })}
      </div>

      {/* Légende */}
      <p className="text-xs text-brun-soft text-center mt-2">
        Trait horizontal avec un point carmine : conjoint·e · Branche verticale : fils / fille de
      </p>
    </div>
  )
}
