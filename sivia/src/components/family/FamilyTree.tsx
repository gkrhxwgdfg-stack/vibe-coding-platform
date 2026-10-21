import { useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { FamilyMemberCard } from '@/components/family/FamilyMemberCard'
import { cn } from '@/lib/utils'
import type { FamilyGeneration, FamilyMember } from '@/lib/types'

interface FamilyTreeProps {
  members: FamilyMember[]
  generations: FamilyGeneration[]
  /** ids des profils connectés de la famille (badge « membre connecté ») */
  connectedProfileIds: Set<string>
  onEditMember?: (member: FamilyMember) => void
  onRemoveMember?: (member: FamilyMember) => void
  onAddGeneration?: (name: string) => Promise<{ error: string | null }>
  onRemoveGeneration?: (generation: FamilyGeneration) => void
}

/** Onglet « Génération 0 » : les membres non classés */
const GENERATION_0_LABEL = 'Génération 0'

/**
 * Arbre générationnel de la famille, présenté en onglets de générations :
 * - « Génération 0 » : les membres non classés (toujours présent, en premier)
 * - puis un onglet par génération nommée (« Les aînés », « Les cousins »…)
 *
 * À l'intérieur d'un onglet, les membres sont reliés à leur référent par
 * une corde dessinée (fil vertical + coude) — avec du relief (ombre portée
 * sous la carte, corde en deux tons) pour un effet artisanal.
 * Sur mobile, chaque onglet défile horizontalement.
 */
export function FamilyTree({
  members,
  generations,
  connectedProfileIds,
  onEditMember,
  onRemoveMember,
  onAddGeneration,
  onRemoveGeneration,
}: FamilyTreeProps) {
  const [activeTab, setActiveTab] = useState<string>('0')
  const [newGenerationName, setNewGenerationName] = useState('')
  const [creatingGeneration, setCreatingGeneration] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)

  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members])

  // Membres par onglet : '0' = non classés, sinon id de la génération
  const membersByTab = useMemo(() => {
    const map = new Map<string, FamilyMember[]>()
    map.set('0', [])
    for (const member of members) {
      const key = member.generation_id ?? '0'
      const list = map.get(key) ?? []
      list.push(member)
      map.set(key, list)
    }
    return map
  }, [members])

  const tabs = useMemo(
    () => [
      { key: '0', label: GENERATION_0_LABEL, generation: null as FamilyGeneration | null },
      ...generations.map((g) => ({ key: g.id, label: g.name, generation: g })),
    ],
    [generations],
  )

  const currentKey = tabs.some((t) => t.key === activeTab) ? activeTab : '0'
  const currentMembers = membersByTab.get(currentKey) ?? []
  const currentGeneration = tabs.find((t) => t.key === currentKey)?.generation ?? null

  async function handleCreateGeneration() {
    if (!onAddGeneration || !newGenerationName.trim()) return
    setCreatingGeneration(true)
    setGenerationError(null)
    const { error } = await onAddGeneration(newGenerationName.trim())
    setCreatingGeneration(false)
    if (error) {
      setGenerationError(error)
      return
    }
    setNewGenerationName('')
  }

  function tiltFor(member: FamilyMember, index: number): number {
    // Rotation douce et stable, déterminée par le prénom + la position
    const seed = member.first_name.length + index
    return (seed % 2 === 0 ? 1 : -1) * (1 + (seed % 3) * 0.75)
  }

  return (
    <div className="space-y-4">
      {/* Onglets de générations */}
      <div
        role="tablist"
        aria-label="Générations de la famille"
        className="flex flex-wrap gap-2 items-center"
      >
        {tabs.map((tab) => {
          const count = (membersByTab.get(tab.key) ?? []).length
          const isActive = tab.key === currentKey
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`generation-panel-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'min-h-11 px-4 rounded-full border-2 font-bold transition-colors inline-flex items-center gap-2',
                isActive
                  ? 'bg-terra text-creme border-terra'
                  : 'bg-creme text-encre border-encre/20 hover:border-terra hover:text-terra',
              )}
            >
              {tab.label}
              <span
                className={cn(
                  'text-xs rounded-full px-1.5 py-0.5',
                  isActive ? 'bg-creme/25' : 'bg-encre/10',
                )}
              >
                {count}
              </span>
            </button>
          )
        })}

        {/* Créer une génération nommée */}
        {onAddGeneration && (
          <span className="inline-flex items-center gap-2">
            <input
              type="text"
              value={newGenerationName}
              onChange={(e) => setNewGenerationName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void handleCreateGeneration()
                }
              }}
              placeholder="Nouvelle génération…"
              aria-label="Nom de la nouvelle génération"
              className="min-h-11 w-44 rounded-full border-2 border-dashed border-encre/25 bg-creme px-4 text-sm focus:border-terra focus:outline-none"
            />
            <button
              type="button"
              onClick={() => void handleCreateGeneration()}
              disabled={creatingGeneration || !newGenerationName.trim()}
              aria-label="Créer cette génération"
              className="min-h-11 min-w-11 rounded-full bg-sauge text-creme inline-flex items-center justify-center hover:bg-sauge-dark disabled:opacity-50"
            >
              <Plus size={18} aria-hidden="true" />
            </button>
          </span>
        )}
      </div>

      {generationError && (
        <p className="text-carmine font-bold text-sm" role="alert">
          {generationError}
        </p>
      )}

      {/* Panneau de l'onglet actif */}
      <div
        role="tabpanel"
        id={`generation-panel-${currentKey}`}
        aria-label={currentGeneration ? `Génération ${currentGeneration.name}` : GENERATION_0_LABEL}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="kicker">
            {currentGeneration ? currentGeneration.name : GENERATION_0_LABEL}
            {currentGeneration ? '' : ' — non classés'}
          </p>
          {currentGeneration && onRemoveGeneration && (
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    `Supprimer la génération « ${currentGeneration.name} » ? Ses membres resteront dans l'arbre, non classés.`,
                  )
                ) {
                  onRemoveGeneration(currentGeneration)
                }
              }}
              aria-label={`Supprimer la génération ${currentGeneration.name}`}
              className="min-h-11 px-3 rounded-full text-sm font-bold text-encre-soft hover:text-carmine inline-flex items-center gap-1.5"
            >
              <X size={15} aria-hidden="true" /> Supprimer la génération
            </button>
          )}
        </div>

        {currentMembers.length === 0 ? (
          <p className="text-brun-soft text-center py-6">
            {currentKey === '0'
              ? 'Aucun membre non classé. Crée une génération nommée pour organiser l’arbre.'
              : 'Cette génération est encore vide.'}
          </p>
        ) : (
          /* Rangée horizontale défilante, reliée par la corde */
          <div className="relative">
            {/* Corde horizontale principale (fil de la génération) */}
            <div
              className="absolute left-2 right-2 top-[-10px] h-1 rounded-full bg-gradient-to-r from-terra/20 via-terra/60 to-terra/20"
              aria-hidden="true"
            />
            <div className="flex gap-5 overflow-x-auto pb-3 pt-3 justify-start snap-x">
              {currentMembers.map((member, index) => {
                const parent = member.parent_id ? byId.get(member.parent_id) : null
                const hasParentInTab = !!parent && (parent.generation_id ?? '0') === currentKey
                return (
                  <div key={member.id} className="relative">
                    {/* Corde verticale : le nœud pend au fil de la génération */}
                    <div className="flex flex-col items-center" aria-hidden="true">
                      <span className="block w-0.5 h-5 bg-terra/70" />
                      <span className="block w-2.5 h-2.5 rounded-full bg-terra shadow-[0_1px_2px_rgba(74,55,40,0.4)] -mt-0.5" />
                    </div>
                    {/* Relier visuellement au référent quand il est dans le même onglet */}
                    {hasParentInTab && (
                      <span
                        className="absolute -top-2.5 left-1/2 w-6 h-0.5 bg-terra/50"
                        aria-hidden="true"
                      />
                    )}
                    <FamilyMemberCard
                      member={member}
                      parent={parent}
                      connectedProfileIds={connectedProfileIds}
                      tilt={tiltFor(member, index)}
                      onEdit={onEditMember}
                      onRemove={onRemoveMember}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
