import type { FamilyLinkKind, FamilyMember } from './types'

/**
 * Moteur de disposition de l'arbre généalogique — logique pure, sans vue.
 *
 * ORIENTATION : l'arbre MONTE de génération en génération. Les aînés
 * (la « base ») sont en BAS (y = 0), les générations suivantes au-dessus
 * (y croissant vers le haut). Visuellement, y est ensuite inversé par le
 * composant (les aînés apparaissent en bas de l'écran).
 *
 * RÈGLES :
 * - lien « parent » (fils/fille de…) : branche montante — l'enfant se
 *   place au-dessus de son référent (ou de ses deux référents).
 * - lien « partner » (conjoint·e de…) : branche horizontale — le conjoint
 *   se place à côté de son partenaire, même rangée.
 * - « relié aux deux » (parent_id + parent2_id) : l'enfant est centré au-dessus
 *   du couple, relié aux deux par la corde.
 *
 * COMPACITÉ : les colonnes se remplissent au fur et à mesure (pas de trous),
 * l'arbre est centré horizontalement.
 */

export interface TreeNode {
  member: FamilyMember
  /** Colonne (0 = à gauche), en demi-unités : le centre d'une carte = x + 0.5 */
  x: number
  /** Rangée logique : 0 = aînés (base, en bas), croissant vers le haut */
  y: number
  /** Identifiant du couple si le membre en fait partie */
  coupleId: string | null
}

export interface TreeSegment {
  kind: 'vertical' | 'horizontal' | 'couple'
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface FamilyTreeLayout {
  nodes: TreeNode[]
  segments: TreeSegment[]
  columns: number
  rows: number
  /** Décalage appliqué pour centrer l'arbre (à ajouter à chaque x) */
  offsetX: number
}

/** Nature effective d'un lien : partner si link_kind = partner, sinon parent */
export function effectiveLinkKind(member: FamilyMember): FamilyLinkKind {
  return member.link_kind === 'partner' ? 'partner' : 'parent'
}

interface Couple {
  id: string
  a: FamilyMember
  b: FamilyMember
}

/** Construit la disposition de l'arbre à partir des membres et de leurs liens */
export function buildFamilyTreeLayout(members: FamilyMember[]): FamilyTreeLayout {
  if (members.length === 0) return { nodes: [], segments: [], columns: 0, rows: 0, offsetX: 0 }

  const byId = new Map(members.map((m) => [m.id, m]))

  // ---------- Couples ----------
  const couples = new Map<string, Couple>()
  const memberToCouple = new Map<string, string>()
  for (const member of members) {
    if (effectiveLinkKind(member) !== 'partner') continue
    const partner = member.parent_id ? byId.get(member.parent_id) : undefined
    if (!partner) continue
    if (memberToCouple.has(member.id) || memberToCouple.has(partner.id)) continue
    const coupleId = `couple-${member.id}-${partner.id}`
    couples.set(coupleId, { id: coupleId, a: partner, b: member })
    memberToCouple.set(partner.id, coupleId)
    memberToCouple.set(member.id, coupleId)
  }

  // ---------- Enfants : regroupés par référent (lien de type parent) ----------
  // Un enfant peut avoir deux référents (parent_id + parent2_id) : on le
  // rattache au premier, et on mémorise le second pour la corde.
  const childrenOf = new Map<string, FamilyMember[]>()
  for (const member of members) {
    if (effectiveLinkKind(member) !== 'parent') continue
    if (!member.parent_id || !byId.has(member.parent_id)) continue
    const list = childrenOf.get(member.parent_id) ?? []
    list.push(member)
    childrenOf.set(member.parent_id, list)
  }
  for (const list of childrenOf.values()) {
    list.sort((a, b) => a.first_name.localeCompare(b.first_name, 'fr'))
  }

  // ---------- Disposition ----------
  const nodes: TreeNode[] = []
  const segments: TreeSegment[] = []
  const nodeById = new Map<string, TreeNode>()
  const visited = new Set<string>()
  let nextColumn = 0

  function addNode(member: FamilyMember, x: number, y: number): TreeNode {
    const node: TreeNode = {
      member,
      x,
      y,
      coupleId: memberToCouple.get(member.id) ?? null,
    }
    nodes.push(node)
    nodeById.set(member.id, node)
    visited.add(member.id)
    if (x + 1 > nextColumn) nextColumn = x + 1
    return node
  }

  /** Vrai si le membre a un lien parent vers un membre existant */
  function hasParentLink(m: FamilyMember): boolean {
    return (
      m.parent_id != null && byId.has(m.parent_id) && effectiveLinkKind(m) === 'parent'
    )
  }

  // Racines = aînés (sans lien parent) : la BASE, rangée 0 (en bas)
  const roots = members.filter((m) => !hasParentLink(m))
  roots.sort((a, b) => a.first_name.localeCompare(b.first_name, 'fr'))

  // Place les aînés : couples côte à côte, célibataires seuls
  const placedRootCouples = new Set<string>()
  for (const root of roots) {
    const coupleId = memberToCouple.get(root.id)
    if (coupleId && !placedRootCouples.has(coupleId)) {
      const couple = couples.get(coupleId)!
      const nodeA = addNode(couple.a, nextColumn, 0)
      const nodeB = addNode(couple.b, nextColumn, 0)
      nextColumn += 1
      segments.push({ kind: 'couple', x1: nodeA.x + 0.5, y1: 0, x2: nodeB.x - 0.5, y2: 0 })
      placedRootCouples.add(coupleId)
    } else if (!visited.has(root.id)) {
      addNode(root, nextColumn, 0)
    }
  }

  // Monte génération par génération : les enfants au-dessus (y+1) de leurs aînés
  let currentRow = roots.filter((r) => visited.has(r.id))
  let depth = 0
  while (currentRow.length > 0 && depth < 20) {
    const childY = depth + 1
    const barY = childY - 0.5 // la barre flotte entre les deux rangées
    const nextRow: FamilyMember[] = []

    // Groupes de la rangée : un couple = un groupe (ses enfants sont communs)
    const groups: { parentIds: string[]; anchorX: number }[] = []
    const seenGroups = new Set<string>()
    for (const m of currentRow) {
      const coupleId = memberToCouple.get(m.id)
      const key = coupleId ?? m.id
      if (seenGroups.has(key)) continue
      seenGroups.add(key)
      if (coupleId) {
        const couple = couples.get(coupleId)!
        const xa = nodeById.get(couple.a.id)?.x ?? 0
        const xb = nodeById.get(couple.b.id)?.x ?? 0
        groups.push({ parentIds: [couple.a.id, couple.b.id], anchorX: (xa + xb) / 2 + 0.5 })
      } else {
        groups.push({ parentIds: [m.id], anchorX: (nodeById.get(m.id)?.x ?? 0) + 0.5 })
      }
    }

    for (const group of groups) {
      // Enfants des référents du groupe (un enfant « relié aux deux » apparaît une fois)
      const seenChild = new Set<string>()
      const children: FamilyMember[] = []
      for (const pid of group.parentIds) {
        for (const child of childrenOf.get(pid) ?? []) {
          if (seenChild.has(child.id) || visited.has(child.id)) continue
          seenChild.add(child.id)
          children.push(child)
        }
      }
      if (children.length === 0) continue
      children.sort((a, b) => a.first_name.localeCompare(b.first_name, 'fr'))

      // Place la fratrie à partir de la prochaine colonne libre (compact, sans trou)
      const startX = nextColumn
      const childNodes: TreeNode[] = []
      children.forEach((child, i) => {
        childNodes.push(addNode(child, startX + i, childY))
        nextRow.push(child)
      })

      // Barre horizontale au-dessus de la fratrie + montée depuis le(s) parent(s)
      const firstX = childNodes[0].x + 0.5
      const lastX = childNodes[childNodes.length - 1].x + 0.5
      segments.push({ kind: 'horizontal', x1: firstX, y1: barY, x2: lastX, y2: barY })
      // Corde depuis le référent (ou le milieu du couple)
      segments.push({
        kind: 'vertical',
        x1: group.anchorX,
        y1: depth + 0.5,
        x2: group.anchorX,
        y2: barY,
      })
      // Corde supplémentaire vers le second référent (« relié aux deux »)
      for (const childNode of childNodes) {
        const secondRef = childNode.member.parent2_id
        if (secondRef && group.parentIds.includes(secondRef)) {
          const refNode = nodeById.get(secondRef)
          if (refNode) {
            segments.push({
              kind: 'vertical',
              x1: refNode.x + 0.5,
              y1: depth + 0.5,
              x2: refNode.x + 0.5,
              y2: barY,
            })
          }
        }
      }
      // Chaque enfant monte à la barre
      for (const childNode of childNodes) {
        segments.push({
          kind: 'vertical',
          x1: childNode.x + 0.5,
          y1: barY,
          x2: childNode.x + 0.5,
          y2: childY,
        })
      }

      // Conjoint d'un enfant : placé à côté, même rangée
      for (const childNode of childNodes) {
        const coupleId = memberToCouple.get(childNode.member.id)
        if (!coupleId) continue
        const couple = couples.get(coupleId)!
        const partner = couple.a.id === childNode.member.id ? couple.b : couple.a
        if (visited.has(partner.id)) continue
        const partnerNode = addNode(partner, childNode.x + 1, childY)
        nextRow.push(partner)
        segments.push({
          kind: 'couple',
          x1: childNode.x + 0.5,
          y1: childY,
          x2: partnerNode.x - 0.5,
          y2: childY,
        })
      }
    }

    currentRow = nextRow
    depth += 1
  }

  // ---------- Membres non atteints (liens cassés, cycles) : rangée du haut ----------
  const orphans = members.filter((m) => !visited.has(m.id))
  if (orphans.length > 0) {
    const orphanY = depth
    orphans
      .sort((a, b) => a.first_name.localeCompare(b.first_name, 'fr'))
      .forEach((m, i) => addNode(m, i, orphanY))
  }

  // ---------- Centrage horizontal ----------
  const columns = nextColumn
  const rows = nodes.reduce((max, n) => Math.max(max, n.y), 0) + 1
  const minX = nodes.reduce((min, n) => Math.min(min, n.x), 0)
  const maxX = nodes.reduce((max, n) => Math.max(max, n.x), 0)
  // Centre l'arbre : décalage pour que le milieu tombe sur la colonne centrale
  const offsetX = -(minX + maxX) / 2

  return { nodes, segments, columns, rows, offsetX }
}
