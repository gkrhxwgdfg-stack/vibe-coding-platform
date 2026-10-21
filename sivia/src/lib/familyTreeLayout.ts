import type { FamilyLinkKind, FamilyMember } from './types'

/**
 * Moteur de disposition de l'arbre généalogique — logique pure, sans vue.
 *
 * ORIENTATION : l'arbre DESCEND de génération en génération. Les aînés
 * (la « base ») sont en HAUT (rangée 0), les générations suivantes en
 * dessous. C'est l'orientation naturelle de lecture d'une page web, sans
 * inversion de coordonnées.
 *
 * RÈGLES :
 * - lien « parent » (fils/fille de…) : branche descendante — l'enfant se
 *   place sous son référent (ou sous ses deux référents).
 * - lien « partner » (conjoint·e de…) : branche horizontale — le conjoint
 *   se place à côté de son partenaire, même rangée.
 * - « relié aux deux » (parent_id + parent2_id) : l'enfant est centré sous
 *   le couple, relié aux deux par la corde.
 *
 * GÉOMÉTRIE : le moteur produit des coordonnées en PIXELS directement
 * (bord gauche/haut de chaque carte, segments de corde compris) : la vue
 * n'a aucune conversion à faire. Disposition « tidy tree » : chaque
 * sous-arbre occupe un bloc contigu, les enfants sont centrés sous leur
 * référent, les blocs ne se chevauchent jamais, et l'arbre entier est
 * centré horizontalement (une personne seule est centrée au milieu).
 */

export const TREE_GEOMETRY = {
  /** Largeur d'une carte (polaroïd) */
  CARD_W: 176,
  /** Hauteur du bloc carte (polaroïd + boutons d'action) — ancre basse de la corde */
  CARD_H: 312,
  /** Hauteur de la rangée « + » sous la carte */
  PLUS_H: 48,
  /** Écart horizontal entre deux colonnes de cartes */
  PITCH_X: 212,
  /** Écart vertical entre deux rangées */
  PITCH_Y: 420,
  /** Espace horizontal entre deux blocs */
  GAP_X: 36,
  /** Hauteur de la corde d'union dans la carte (centre de la photo) */
  COUPLE_Y: 96,
  /** La barre de fratrie flotte 24 px au-dessus de la rangée suivante */
  BAR_GAP: 24,
  /** Espace en haut du canevas (bouton « + » carmine « ajouter un aîné ») */
  TOP_PAD: 64,
  /** Marge latérale du canevas */
  SIDE_PAD: 24,
  /** Marge basse du canevas */
  BOTTOM_PAD: 16,
} as const

const {
  CARD_W,
  CARD_H,
  PLUS_H,
  PITCH_X,
  PITCH_Y,
  GAP_X,
  COUPLE_Y,
  BAR_GAP,
  TOP_PAD,
  SIDE_PAD,
  BOTTOM_PAD,
} = TREE_GEOMETRY

export interface TreeNode {
  member: FamilyMember
  /** Bord gauche de la carte, en px (coordonnées finales, centrées) */
  x: number
  /** Bord haut de la carte, en px */
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
  /** Largeur du canevas, en px */
  width: number
  /** Hauteur du canevas, en px */
  height: number
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
  if (members.length === 0) {
    return { nodes: [], segments: [], width: 340, height: 420 }
  }

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

  /** Groupe d'un membre : les deux personnes de son couple, ou lui seul */
  function groupIdsOf(member: FamilyMember): string[] {
    const coupleId = memberToCouple.get(member.id)
    if (!coupleId) return [member.id]
    const couple = couples.get(coupleId)!
    return [couple.a.id, couple.b.id]
  }

  /** Ensemble des ids d'un groupe de référents (couple = ses 2 membres) */
  function groupIdSet(ids: string[]): Set<string> {
    return new Set(ids.flatMap((id) => groupIdsOf(byId.get(id)!)))
  }

  // ---------- Enfants par référent individuel (lien de type parent) ----------
  // Un enfant est rattaché au GROUPE de son référent (couple si le référent
  // est en couple), pour qu'un enfant « relié aux deux » n'apparaisse qu'une
  // fois et soit centré sous le couple. Garde anti-cycle : on ne rattache pas
  // un membre à un descendant de lui-même.
  const childrenOfGroupMap = new Map<string, FamilyMember[]>()

  function groupKeyOf(member: FamilyMember): string {
    const coupleId = memberToCouple.get(member.id)
    return coupleId ?? `solo-${member.id}`
  }

  /**
   * Vrai si `ancestor` est un ancêtre de `member` (ou son conjoint, membre
   * du même groupe) : en remontant les liens parent de `member`, on finit
   * par atteindre `ancestor`. Garde anti-cycle : ignorer un lien qui ferait
   * d'un membre son propre ancêtre.
   */
  function isAncestorOf(ancestor: FamilyMember, member: FamilyMember, depth = 0): boolean {
    if (depth > 20) return false
    if (!member.parent_id) return false
    const parent = byId.get(member.parent_id)
    if (!parent) return false
    if (parent.id === ancestor.id) return true
    // Le conjoint d'un ancêtre est un ancêtre aussi (même groupe)
    const coupleId = memberToCouple.get(parent.id)
    if (coupleId) {
      const couple = couples.get(coupleId)!
      const other = couple.a.id === parent.id ? couple.b.id : couple.a.id
      if (other === ancestor.id) return true
    }
    return isAncestorOf(ancestor, parent, depth + 1)
  }

  for (const member of members) {
    if (effectiveLinkKind(member) !== 'parent') continue
    if (!member.parent_id || !byId.has(member.parent_id)) continue
    const ref = byId.get(member.parent_id)!
    // Anti-cycle : ignorer un lien qui ferait de l'enfant son propre ancêtre
    // (l'enfant serait un ancêtre du référent revendiqué => boucle)
    if (isAncestorOf(member, ref)) continue
    const key = groupKeyOf(ref)
    const list = childrenOfGroupMap.get(key) ?? []
    list.push(member)
    childrenOfGroupMap.set(key, list)
  }

  /** Enfants d'un groupe (couple ou personne seule), dédupliqués, triés par prénom */
  function childrenOfGroup(groupIds: string[]): FamilyMember[] {
    const seen = new Set<string>()
    const out: FamilyMember[] = []
    for (const pid of groupIds) {
      for (const child of childrenOfGroupMap.get(groupKeyOf(byId.get(pid)!)) ?? []) {
        if (seen.has(child.id)) continue
        seen.add(child.id)
        out.push(child)
      }
    }
    out.sort((a, b) => a.first_name.localeCompare(b.first_name, 'fr'))
    return out
  }

  // ---------- Placement ----------
  const nodes: TreeNode[] = []
  const segments: TreeSegment[] = []
  const nodeById = new Map<string, TreeNode>()
  /** Membres dont le nœud est posé (permanent) */
  const reserved = new Set<string>()
  /** Membres en cours de placement (pile de récursion — garde anti-cycle) */
  const placing = new Set<string>()

  function addNode(member: FamilyMember, x: number, y: number): TreeNode {
    const node: TreeNode = {
      member,
      x,
      y,
      coupleId: memberToCouple.get(member.id) ?? null,
    }
    nodes.push(node)
    nodeById.set(member.id, node)
    reserved.add(member.id)
    placing.delete(member.id)
    return node
  }

  interface PlacedSubtree {
    node: TreeNode
    /** Largeur du bloc occupé par le sous-arbre, en px */
    width: number
    /** Tranche d'indices des nœuds du sous-arbre (décalage groupé) */
    nodesFrom: number
    nodesTo: number
    /** Tranche d'indices des segments du sous-arbre */
    segsFrom: number
    segsTo: number
  }

  /**
   * Place un groupe (une personne, ou un couple) à la rangée `row`, bloc
   * commençant à `startX`. Retourne la largeur du bloc en px.
   * Algorithme « tidy tree » post-order :
   *   1. chaque sous-arbre enfant est placé récursivement (largeur connue),
   *   2. les blocs enfants sont posés côte à côte,
   *   3. le bloc = max(référent, enfants) ; le référent est centré sur le
   *      bloc, et tout le sous-arbre (enfants compris) est décalé d'un coup.
   */
  function placeGroup(ids: string[], row: number, startX: number): number {
    for (const id of ids) placing.add(id)
    const y = TOP_PAD + row * PITCH_Y
    const groupSet = groupIdSet(ids)
    const kids = childrenOfGroup(ids).filter(
      (c) => !reserved.has(c.id) && !placing.has(c.id) && !groupSet.has(c.id),
    )
    const ownW = ids.length * PITCH_X - GAP_X
    if (row > 20) return ownW // garde anti-profondeur infinie

    // 1. Sous-arbres enfants, côte à côte
    const subtrees: PlacedSubtree[] = []
    let cursor = startX
    let kidsW = 0
    for (const child of kids) {
      const nodesFrom = nodes.length
      const segsFrom = segments.length
      const width = placeGroup(groupIdsOf(child), row + 1, cursor)
      subtrees.push({
        node: nodeById.get(child.id)!,
        width,
        nodesFrom,
        nodesTo: nodes.length,
        segsFrom,
        segsTo: segments.length,
      })
      cursor += width + GAP_X
      kidsW += width + GAP_X
    }
    if (kids.length > 0) kidsW -= GAP_X

    // 2. Bloc final = le plus large des deux (référent vs bloc enfants)
    const width = Math.max(ownW, kidsW)
    // Centre du BLOC final, en coordonnées absolues
    const center = startX + width / 2

    // 3. Décale les sous-arbres enfants déjà posés pour centrer le
    //    BLOC ENFANTS sous le référent (quand il est plus étroit).
    //    Quand les enfants débordent, ils définissent le bloc et le
    //    référent est posé au centre du bloc (sous les enfants).
    if (kidsW > 0 && kidsW < ownW) {
      const kidShift = (ownW - kidsW) / 2
      for (const st of subtrees) {
        for (let i = st.nodesFrom; i < st.nodesTo; i++) nodes[i].x += kidShift
        for (let i = st.segsFrom; i < st.segsTo; i++) {
          segments[i].x1 += kidShift
          segments[i].x2 += kidShift
        }
      }
    }

    // 4. Référent(s) posé(s) au centre du BLOC final
    const personNodes: TreeNode[] = []
    if (ids.length === 2) {
      const couple = couples.get(memberToCouple.get(ids[0])!)!
      const nodeA = addNode(byId.get(couple.a.id)!, center - ownW / 2, y)
      const nodeB = addNode(byId.get(couple.b.id)!, center - ownW / 2 + PITCH_X, y)
      personNodes.push(nodeA, nodeB)
      segments.push({
        kind: 'couple',
        x1: nodeA.x + CARD_W,
        y1: y + COUPLE_Y,
        x2: nodeB.x,
        y2: y + COUPLE_Y,
      })
    } else {
      personNodes.push(addNode(byId.get(ids[0])!, center - CARD_W / 2, y))
    }

    // 5. Corde : barre au-dessus de la fratrie. Émise dès que les centres des
    //    référents et des enfants ne sont pas tous confondus (plusieurs
    //    enfants, un seul enfant sous un couple, parent décalé…). Si tout est
    //    aligné, les verticales se touchent directement.
    if (subtrees.length > 0) {
      const barY = y + PITCH_Y - BAR_GAP
      const barXs = [
        ...personNodes.map((pn) => pn.x + CARD_W / 2),
        ...subtrees.map((st) => st.node.x + CARD_W / 2),
      ]
      const barX1 = Math.min(...barXs)
      const barX2 = Math.max(...barXs)
      if (barX2 - barX1 > 0.5) {
        segments.push({ kind: 'horizontal', x1: barX1, y1: barY, x2: barX2, y2: barY })
      }
      for (const pn of personNodes) {
        segments.push({
          kind: 'vertical',
          x1: pn.x + CARD_W / 2,
          y1: y + CARD_H,
          x2: pn.x + CARD_W / 2,
          y2: barY,
        })
      }
      // Corde supplémentaire vers un second référent hors du groupe (« relié aux deux »)
      for (const st of subtrees) {
        const p2 = st.node.member.parent2_id
        if (p2 && !ids.includes(p2)) {
          const refNode = nodeById.get(p2)
          if (refNode) {
            segments.push({
              kind: 'vertical',
              x1: refNode.x + CARD_W / 2,
              y1: refNode.y + CARD_H,
              x2: refNode.x + CARD_W / 2,
              y2: barY,
            })
          }
        }
      }
      // Descente de la barre vers chaque enfant
      for (const st of subtrees) {
        segments.push({
          kind: 'vertical',
          x1: st.node.x + CARD_W / 2,
          y1: barY,
          x2: st.node.x + CARD_W / 2,
          y2: st.node.y,
        })
      }
    }

    return width
  }

  // ---------- Racines : aînés (sans lien parent), rangée 0 ----------
  function hasParentLink(m: FamilyMember): boolean {
    return m.parent_id != null && byId.has(m.parent_id) && effectiveLinkKind(m) === 'parent'
  }

  const roots = members.filter((m) => !hasParentLink(m))
  roots.sort((a, b) => a.first_name.localeCompare(b.first_name, 'fr'))

  let cursor = 0
  for (const root of roots) {
    if (reserved.has(root.id)) continue
    cursor += placeGroup(groupIdsOf(root), 0, cursor) + GAP_X
  }

  // ---------- Membres non atteints (liens cassés, cycles) : rangée du bas ----------
  const orphans = members.filter((m) => !reserved.has(m.id))
  if (orphans.length > 0) {
    const baseY =
      nodes.length > 0 ? Math.max(...nodes.map((n) => n.y)) + PITCH_Y : TOP_PAD
    let ox = 0
    for (const m of orphans.sort((a, b) => a.first_name.localeCompare(b.first_name, 'fr'))) {
      addNode(m, ox, baseY)
      ox += PITCH_X
    }
  }

  // ---------- Centrage horizontal ----------
  const minLeft = Math.min(...nodes.map((n) => n.x))
  const maxRight = Math.max(...nodes.map((n) => n.x + CARD_W))
  const shift = SIDE_PAD - minLeft
  for (const n of nodes) n.x += shift
  for (const s of segments) {
    s.x1 += shift
    s.x2 += shift
  }
  const width = maxRight - minLeft + 2 * SIDE_PAD
  const maxBottom = Math.max(...nodes.map((n) => n.y + CARD_H + PLUS_H))
  const height = Math.max(maxBottom + BOTTOM_PAD, TOP_PAD + CARD_H + PLUS_H + BOTTOM_PAD)

  return { nodes, segments, width, height }
}
