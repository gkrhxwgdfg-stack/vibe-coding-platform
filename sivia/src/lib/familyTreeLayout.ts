import type { FamilyLinkKind, FamilyMember } from './types'

/**
 * Moteur de disposition de l'arbre généalogique — logique pure, sans vue.
 *
 * ORIENTATION : l'arbre DESCEND de génération en génération. Les aînés
 * (la « base ») sont en HAUT (profondeur 0), les générations suivantes en
 * dessous. C'est l'orientation naturelle de lecture d'une page web, sans
 * inversion de coordonnées.
 *
 * RÈGLES :
 * - lien « parent » (fils/fille de…) : branche descendante — l'enfant se
 *   place sous son référent (ou sous ses deux référents), une génération
 *   plus bas.
 * - lien « partner » (conjoint·e, copine, pacsé·e…) : branche horizontale —
 *   le conjoint se place à CÔTÉ de son partenaire, à la MÊME génération
 *   (jamais au-dessus, jamais en dessous).
 * - « relié aux deux » (parent_id + parent2_id) : l'enfant est centré sous
 *   le couple, relié aux deux par la corde.
 *
 * PROFONDEUR : calculée UNIQUEMENT à partir des liens, jamais d'une
 * génération nommée. Un conjoint hérite de la profondeur de son
 * partenaire, un enfant prend profondeur(référent) + 1. Le graphe est
 * exploré en largeur (file BFS) depuis les racines (sans lien parent),
 * avec garde anti-cycle. Une personne rattachée à une génération déjà plus
 * profonde conserve sa profondeur réelle : ajouter les grands-parents
 * APRÈS les parents les fait apparaître AU-DESSUS.
 *
 * GÉOMÉTRIE : le moteur produit des coordonnées en PIXELS directement
 * (bord gauche/haut de chaque carte, segments de corde compris) : la vue
 * n'a aucune conversion à faire. Disposition « tidy tree » : chaque
 * sous-arbre occupe un bloc contigu en x, les enfants sont centrés sous
 * leur référent, les blocs ne se chevauchent jamais, et l'arbre entier
 * est centré horizontalement (une personne seule est centrée au milieu).
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
  /** Écart vertical entre deux générations */
  PITCH_Y: 420,
  /** Espace horizontal entre deux blocs */
  GAP_X: 36,
  /** Hauteur de l'attache de scotch dans la carte (centre de la photo) */
  COUPLE_Y: 96,
  /** La barre de fratrie flotte 24 px au-dessus de la génération suivante */
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
  // Un lien « partner » unit deux personnes à la MÊME génération. Le couple
  // est traité comme UN groupe : conjoint à côté, enfants centrés sous les deux.
  // Le membre « a » (à gauche) est le référent : celui dont le parent_id
  // pointe vers l'autre, ou le premier par prénom si aucun des deux n'a de
  // lien parent. L'autre (le conjoint) est « b », placé à droite.
  const couples = new Map<string, Couple>()
  const memberToCouple = new Map<string, string>()
  // Ordre d'insertion stable (prénoms) pour un résultat déterministe
  const partnerLinks = members
    .filter((m) => effectiveLinkKind(m) === 'partner' && m.parent_id && byId.has(m.parent_id))
    .sort((a, b) => a.first_name.localeCompare(b.first_name, 'fr'))
  for (const member of partnerLinks) {
    const partner = byId.get(member.parent_id!)!
    if (memberToCouple.has(member.id) || memberToCouple.has(partner.id)) continue
    // « member » porte le lien partner (member.parent_id = partner) : member
    // est le conjoint, partner est le référent du couple.
    const a = partner
    const b = member
    const coupleId = `couple-${a.id}-${b.id}`
    couples.set(coupleId, { id: coupleId, a, b })
    memberToCouple.set(a.id, coupleId)
    memberToCouple.set(b.id, coupleId)
  }

  /** Groupe d'un membre : les deux personnes de son couple (a à gauche, b à droite), ou lui seul */
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

  function groupKeyOf(member: FamilyMember): string {
    const coupleId = memberToCouple.get(member.id)
    return coupleId ?? `solo-${member.id}`
  }

  // ---------- Profondeur (génération) par les liens, en largeur ----------
  // Racine = sans lien parent valide. BFS : un conjoint hérite de la
  // profondeur de son partenaire (même génération), un enfant prend
  // profondeur(référent) + 1. Garde anti-cycle (visited). Un membre non
  // atteint (cycle isolé) reçoit la profondeur 0.
  const depth = new Map<string, number>()
  {
    // Racine = sans lien parent valide ET sans lien partner valide.
    // Un membre « partner » n'est jamais racine : il dépend de son partenaire.
    const roots = members.filter((m) => {
      if (effectiveLinkKind(m) === 'partner') return false
      return m.parent_id == null || !byId.has(m.parent_id)
    })
    // Ordre stable : prénoms, pour un résultat déterministe
    roots.sort((a, b) => a.first_name.localeCompare(b.first_name, 'fr'))
    const queue: { id: string; d: number }[] = roots.map((m) => ({ id: m.id, d: 0 }))
    const seen = new Set<string>(roots.map((m) => m.id))
    while (queue.length > 0) {
      const { id, d } = queue.shift()!
      depth.set(id, Math.max(depth.get(id) ?? 0, d))
      // Conjoint : même génération
      const coupleId = memberToCouple.get(id)
      if (coupleId) {
        const couple = couples.get(coupleId)!
        for (const other of [couple.a, couple.b]) {
          if (other.id === id) continue
          const cur = depth.get(other.id)
          if (cur === undefined || d > cur) depth.set(other.id, d)
          if (!seen.has(other.id)) {
            seen.add(other.id)
            queue.push({ id: other.id, d })
          }
        }
      }
      // Enfants : génération suivante (référencés par n'importe quel membre du groupe)
      const myGroupKey = groupKeyOf(byId.get(id)!)
      for (const child of members) {
        if (effectiveLinkKind(child) !== 'parent') continue
        if (!child.parent_id || !byId.has(child.parent_id)) continue
        if (groupKeyOf(byId.get(child.parent_id)!) !== myGroupKey) continue
        const nd = d + 1
        const cur = depth.get(child.id)
        if (cur === undefined || nd > cur) depth.set(child.id, nd)
        if (!seen.has(child.id)) {
          seen.add(child.id)
          queue.push({ id: child.id, d: nd })
        }
      }
    }
    // Cycles isolés : profondeur 0
    for (const m of members) if (!depth.has(m.id)) depth.set(m.id, 0)
  }

  // ---------- Enfants par groupe de référents (lien de type parent) ----------
  // Un enfant est rattaché au GROUPE de son référent (couple si le référent
  // est en couple), pour qu'un enfant « relié aux deux » n'apparaisse qu'une
  // fois et soit centré sous le couple. Garde anti-cycle : on ne rattache pas
  // un membre à un descendant de lui-même.
  const childrenOfGroupMap = new Map<string, FamilyMember[]>()

  function isAncestorOf(ancestor: FamilyMember, member: FamilyMember, seen = new Set<string>()): boolean {
    if (seen.has(member.id)) return false
    seen.add(member.id)
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
    return isAncestorOf(ancestor, parent, seen)
  }

  for (const member of members) {
    if (effectiveLinkKind(member) !== 'parent') continue
    if (!member.parent_id || !byId.has(member.parent_id)) continue
    const ref = byId.get(member.parent_id)!
    // Anti-cycle : l'enfant ne doit pas être un ancêtre du référent revendiqué
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

  // ---------- Placement par niveau de génération ----------
  // Les y viennent des profondeurs calculées plus haut (jamais d'une
  // génération nommée) : chaque couple/personne est ancré à sa vraie
  // génération, même si elle a été ajoutée après coup.
  const maxDepth = Math.max(...depth.values())
  const rowOf = new Map<string, number>()
  for (const [id, d] of depth) rowOf.set(id, d)

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
  function placeGroup(ids: string[], startX: number): number {
    for (const id of ids) placing.add(id)
    const row = Math.min(...ids.map((id) => rowOf.get(id) ?? 0))
    const y = TOP_PAD + row * PITCH_Y
    const groupSet = groupIdSet(ids)
    const kids = childrenOfGroup(ids).filter(
      (c) => !reserved.has(c.id) && !placing.has(c.id) && !groupSet.has(c.id),
    )
    const ownW = ids.length * PITCH_X - GAP_X
    if (row > 20) return ownW // garde anti-profondeur infinie

    // 1. Sous-arbres enfants, côte à côte (à leur propre profondeur)
    const subtrees: PlacedSubtree[] = []
    let cursor = startX
    let kidsW = 0
    for (const child of kids) {
      const nodesFrom = nodes.length
      const segsFrom = segments.length
      const width = placeGroup(groupIdsOf(child), cursor)
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
      const nodeA = addNode(couple.a, center - ownW / 2, y)
      const nodeB = addNode(couple.b, center - ownW / 2 + PITCH_X, y)
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

    // 5. Corde : barre commune au-dessus de la fratrie (quand il y a plusieurs
    //    enfants ou des centres différents), puis descente depuis le bas de
    //    chaque carte de référent et vers le haut de chaque carte d'enfant.
    if (subtrees.length > 0) {
      const childYs = subtrees.map((st) => st.node.y)
      const minChildY = Math.min(...childYs)
      const barY = minChildY - BAR_GAP
      const barXs = [
        ...personNodes.map((pn) => pn.x + CARD_W / 2),
        ...subtrees.map((st) => st.node.x + CARD_W / 2),
      ]
      // Seconds référents « relié aux deux » hors du groupe
      const extraRefs = new Map<string, TreeNode>()
      for (const st of subtrees) {
        const p2 = st.node.member.parent2_id
        if (p2 && !ids.includes(p2)) {
          const refNode = nodeById.get(p2)
          if (refNode) {
            extraRefs.set(p2, refNode)
            barXs.push(refNode.x + CARD_W / 2)
          }
        }
      }
      const barX1 = Math.min(...barXs)
      const barX2 = Math.max(...barXs)
      if (barX2 - barX1 > 0.5) {
        segments.push({ kind: 'horizontal', x1: barX1, y1: barY, x2: barX2, y2: barY })
      }
      for (const pn of personNodes) {
        segments.push({
          kind: 'vertical',
          x1: pn.x + CARD_W / 2,
          y1: pn.y + CARD_H,
          x2: pn.x + CARD_W / 2,
          y2: barY,
        })
      }
      for (const refNode of extraRefs.values()) {
        segments.push({
          kind: 'vertical',
          x1: refNode.x + CARD_W / 2,
          y1: refNode.y + CARD_H,
          x2: refNode.x + CARD_W / 2,
          y2: barY,
        })
      }
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
  // Les racines sont groupées par couple pour ne pas scinder un couple aîné.
  // Quand plusieurs racines existent (plusieurs couples aînés, ex.
  // grands-parents paternels + maternels), elles se suivent côte à côte
  // à la même profondeur.
  function hasParentLink(m: FamilyMember): boolean {
    return m.parent_id != null && byId.has(m.parent_id) && effectiveLinkKind(m) === 'parent'
  }

  // Racines = sans lien parent valide ET pas le conjoint (b) d'un couple.
  // Le référent du couple (a) est racine même s'il est en couple : il est
  // placé avec son conjoint via groupIdsOf. Le conjoint (b) n'est jamais
  // racine : il est toujours placé avec a.
  const rootGroups = new Map<string, string[]>()
  const roots = members.filter((m) => {
    if (hasParentLink(m)) return false
    // Le conjoint (b) d'un couple n'est jamais racine
    const coupleId = memberToCouple.get(m.id)
    if (coupleId) {
      const couple = couples.get(coupleId)!
      if (couple.b.id === m.id) return false
    }
    return true
  })
  roots.sort((a, b) => a.first_name.localeCompare(b.first_name, 'fr'))
  for (const root of roots) {
    const key = groupKeyOf(root)
    const list = rootGroups.get(key) ?? []
    list.push(root.id)
    rootGroups.set(key, list)
  }

  // Passe 1 : place tous les groupes racines (profondeur 0).
  // Chaque racine est placée avec tout son groupe (couple inclus).
  let cursor = 0
  for (const root of roots) {
    if (reserved.has(root.id)) continue
    cursor += placeGroup(groupIdsOf(root), cursor) + GAP_X
  }

  // Passe 2 : place les groupes non atteints (conjoints orphelins d'un lien
  // partner cassé, racines isolées…) à leur profondeur réelle, à la suite.
  const unreached = members.filter((m) => !reserved.has(m.id))
  if (unreached.length > 0) {
    // Groupés par couple pour ne pas scinder un couple
    const unreachedGroups = new Map<string, string[]>()
    for (const m of unreached.sort((a, b) => a.first_name.localeCompare(b.first_name, 'fr'))) {
      const key = groupKeyOf(m)
      const list = unreachedGroups.get(key) ?? []
      list.push(m.id)
      unreachedGroups.set(key, list)
    }
    for (const ids of unreachedGroups.values()) {
      if (ids.some((id) => reserved.has(id))) continue
      cursor += placeGroup(ids, cursor) + GAP_X
    }
  }

  // Passe 3 : membres encore non atteints (cycles) : rangée du bas, côte à côte.
  const orphans = members.filter((m) => !reserved.has(m.id))
  {
    const orphanY = TOP_PAD + (maxDepth + 1) * PITCH_Y
    let ox = 0
    for (const m of orphans.sort((a, b) => a.first_name.localeCompare(b.first_name, 'fr'))) {
      addNode(m, ox, orphanY)
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
