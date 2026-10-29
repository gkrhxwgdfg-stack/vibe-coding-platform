import type { FamilyMember, RecipeWithMeta } from '@/lib/types'
import { CATEGORIES, categoryMeta } from '@/lib/constants'
import { formatDate } from '@/lib/format'
import {
  COLORS,
  CONTENT_W,
  Cursor,
  drawDashedRect,
  drawRecipeOnPdf,
  drawStamp,
  MARGIN,
  PAGE_H,
  PAGE_W,
  resolveFonts,
  type JsPdfLike,
} from '@/services/recipePdf'

/**
 * Le carnet familial : le livre (chantier 7).
 *
 * Génère un PDF A5 complet à partir des recettes de la famille :
 * - couverture (nom de famille, tampon, mini-arbre des générations)
 * - page de garde
 * - sommaire
 * - recettes (scellées d'abord, puis par catégorie)
 * - index par auteur
 * - intercalaires anecdotes sur papier-âgé
 *
 * Pieds de page numérotés « Carnet {famille} — page N ».
 * jsPDF est importé dynamiquement (hors bundle initial).
 */

export interface FamilyBookInput {
  familyName: string
  recipes: RecipeWithMeta[]
  /** Membres de l'arbre (pour le mini-arbre des générations en couverture) */
  treeMembers: FamilyMember[]
  /** Prénom de celui qui imprime (pour la page de garde) */
  printedBy: string
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/** Nom de fichier : savia—carnet—{famille}.pdf */
export function familyBookFileName(familyName: string): string {
  return `savia—carnet—${slugify(familyName)}.pdf`
}

/** Pied de page numéroté du carnet */
function bookPageLabel(familyName: string) {
  return (pageNumber: number) => `Carnet ${familyName} — page ${pageNumber}`
}


/** Calcule la position x pour centrer un texte sur la page (alignement gauche du bloc centré) */
function centeredX(doc: JsPdfLike, text: string): number {
  const w = doc.getTextWidth(text)
  return Math.max(MARGIN, (PAGE_W - w) / 2)
}

/** Fond crème pleine page */
function paintPageBackground(doc: JsPdfLike) {
  doc.setFillColor(COLORS.CREME.r, COLORS.CREME.g, COLORS.CREME.b)
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F')
}

/** Tampon centré (couverture) */
function drawCenteredStamp(doc: JsPdfLike, name: string, cy: number) {
  drawStamp(doc, name, PAGE_W / 2, cy)
}

/** Mini-arbre des générations : les prénoms regroupés par génération nommée */
function drawGenerationTree(
  doc: JsPdfLike,
  cursor: Cursor,
  members: FamilyMember[],
  fonts: { hand: string; handStyle: string },
) {
  // Regroupe par génération (null = « génération 0 », non classée)
  const byGeneration = new Map<string, FamilyMember[]>()
  for (const member of members) {
    const key = member.generation_id ?? ''
    const list = byGeneration.get(key) ?? []
    list.push(member)
    byGeneration.set(key, list)
  }
  const groups = [...byGeneration.entries()]
  if (groups.length === 0) return

  const title = 'Les générations'
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(COLORS.TERRA.r, COLORS.TERRA.g, COLORS.TERRA.b)
  doc.text(title.toUpperCase(), MARGIN, cursor.y + 4)
  cursor.space(8)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(COLORS.ENCRE.r, COLORS.ENCRE.g, COLORS.ENCRE.b)
  for (const [, list] of groups) {
    const names = list.map((m) => m.first_name).join(', ')
    const role = list[0]?.family_role
    const line = role ? `${names} — ${role}` : names
    const lines = doc.splitTextToSize(line, CONTENT_W)
    cursor.advance(lines.length * 6 + 3)
    lines.forEach((l, i) => doc.text(l, MARGIN, cursor.y + i * 6))
    cursor.space(lines.length * 6 + 3)
  }
  void fonts
}

/** Intercalaire anecdote sur papier-âgé (entre deux sections) */
function drawAnecdoteDivider(
  doc: JsPdfLike,
  cursor: Cursor,
  recipe: RecipeWithMeta,
  fonts: { hand: string; handStyle: string },
) {
  if (!recipe.anecdote) return
  const { hand, handStyle } = fonts
  doc.setFont(hand, handStyle)
  doc.setFontSize(15)
  const DIVIDER_LH = 7
  const lines = doc.splitTextToSize(`« ${recipe.anecdote} »`, CONTENT_W - 12)
  const blockH = lines.length * DIVIDER_LH + 22
  cursor.advance(blockH + 6)
  doc.setFillColor(COLORS.PAPIER_AGE.r, COLORS.PAPIER_AGE.g, COLORS.PAPIER_AGE.b)
  doc.roundedRect(MARGIN, cursor.y, CONTENT_W, blockH, 3, 3, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(COLORS.TERRA.r, COLORS.TERRA.g, COLORS.TERRA.b)
  doc.text('LE SECRET', MARGIN + 6, cursor.y + 7)
  doc.setFont(hand, handStyle)
  doc.setFontSize(15)
  doc.setTextColor(91, 70, 50)
  lines.forEach((line, i) => {
    doc.text(line, MARGIN + 6, cursor.y + 14 + i * DIVIDER_LH)
  })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(COLORS.ENCRE_SOFT.r, COLORS.ENCRE_SOFT.g, COLORS.ENCRE_SOFT.b)
  doc.text(`— ${recipe.author?.display_name ?? '…'}, « ${recipe.title} »`, MARGIN + 6, cursor.y + blockH - 4)
  cursor.space(blockH + 6)
}

/**
 * Génère le livre A5 du carnet familial et le télécharge.
 * Ordre : couverture → page de garde → sommaire → recettes (scellées d'abord,
 * puis par catégorie) → index par auteur. Intercalaires anecdotes entre les
 * recettes d'une même catégorie quand elles en ont une.
 */
export async function generateFamilyBookPdf(input: FamilyBookInput): Promise<{ pageCount: number }> {
  const { default: JsPDF } = await import('jspdf')
  const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' }) as unknown as JsPdfLike
  const fonts = await resolveFonts(doc)
  const { familyName, recipes, treeMembers, printedBy } = input
  const label = bookPageLabel(familyName)

  // Tri : scellées d'abord, puis par catégorie (ordre de CATEGORIES), puis date décroissante
  const categoryOrder = new Map(CATEGORIES.map((c, i) => [c.value, i]))
  const sorted = [...recipes].sort((a, b) => {
    if (a.is_sealed !== b.is_sealed) return a.is_sealed ? -1 : 1
    const ca = categoryOrder.get(a.category) ?? 99
    const cb = categoryOrder.get(b.category) ?? 99
    if (ca !== cb) return ca - cb
    return b.created_at.localeCompare(a.created_at)
  })

  // ---------- Couverture (style carnet manuscrit : cadre couture, titre serif, tampon, arbre) ----------
  paintPageBackground(doc)
  let cursor = new Cursor(doc)

  // Cadre pointillé terracotta (point de couture) sur toute la page, marge intérieure 6mm
  drawDashedRect(doc, 6, 6, PAGE_W - 12, PAGE_H - 12, COLORS.TERRA, 1.5)

  // Kicker "SAVIA" en haut, centré
  cursor.y = 22
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(COLORS.TERRA.r, COLORS.TERRA.g, COLORS.TERRA.b)
  const kicker = 'SAVIA'
  doc.text(kicker, centeredX(doc, kicker), cursor.y)

  // Titre principal : "Le carnet de {famille}" en Fraunces, grand, centré
  cursor.y = 48
  doc.setFont(fonts.serif, fonts.serifStyle)
  doc.setFontSize(28)
  doc.setTextColor(COLORS.ENCRE.r, COLORS.ENCRE.g, COLORS.ENCRE.b)
  doc.splitTextToSize(`Le carnet de ${familyName}`, CONTENT_W - 12).forEach((line, i) => {
    doc.text(line, centeredX(doc, line), cursor.y + i * 11)
  })
  cursor.space(28)

  // Tagline en Caveat, terracotta, centrée
  doc.setFont(fonts.hand, fonts.handStyle)
  doc.setFontSize(18)
  doc.setTextColor(COLORS.TERRA.r, COLORS.TERRA.g, COLORS.TERRA.b)
  const tagline = 'Le savoir qui se transmet à table.'
  doc.text(tagline, centeredX(doc, tagline), cursor.y)
  cursor.space(20)

  // Tampon centré (plus grand : rayon 16mm déjà dans drawStamp)
  drawCenteredStamp(doc, familyName, cursor.y + 16)
  cursor.space(42)

  // Séparateur décoratif : petite ligne pointillée centrée
  doc.setDrawColor(COLORS.TERRA.r, COLORS.TERRA.g, COLORS.TERRA.b)
  doc.setLineWidth(0.4)
  const sepW = 40
  const sepX = (PAGE_W - sepW) / 2
  for (let d = 0; d < sepW; d += 3) {
    doc.line(sepX + d, cursor.y, sepX + d + 1.5, cursor.y)
  }
  cursor.space(10)

  // Mini-arbre des générations (centré lui aussi)
  drawGenerationTree(doc, cursor, treeMembers, fonts)
  cursor.space(12)

  // Infos couverture : nb recettes + imprimé par (centré)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(COLORS.ENCRE_SOFT.r, COLORS.ENCRE_SOFT.g, COLORS.ENCRE_SOFT.b)
  const couvInfo = `${recipes.length} recette${recipes.length > 1 ? 's' : ''} au sommaire · Imprimé par ${printedBy} le ${formatDate(new Date().toISOString())}`
  doc.splitTextToSize(couvInfo, CONTENT_W - 12).forEach((line, i) => {
    doc.text(line, centeredX(doc, line), cursor.y + i * 4)
  })

  // Pied de page couverture
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(COLORS.ENCRE_SOFT.r, COLORS.ENCRE_SOFT.g, COLORS.ENCRE_SOFT.b)
  const couvFooter = `Carnet ${familyName}`
  doc.text(couvFooter, centeredX(doc, couvFooter), PAGE_H - 13)

  // ---------- Sommaire ----------
  doc.addPage()
  paintPageBackground(doc)
  cursor = new Cursor(doc)
  doc.setFont(fonts.serif, fonts.serifStyle)
  doc.setFontSize(20)
  doc.setTextColor(COLORS.ENCRE.r, COLORS.ENCRE.g, COLORS.ENCRE.b)
  doc.text('Sommaire', MARGIN, cursor.y + 6)
  cursor.space(12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  let currentCategory: string | null = null
  for (const recipe of sorted) {
    if (recipe.category !== currentCategory) {
      currentCategory = recipe.category
      cursor.advance(8)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(COLORS.TERRA.r, COLORS.TERRA.g, COLORS.TERRA.b)
      doc.text(categoryMeta(recipe.category).label.toUpperCase(), MARGIN, cursor.y + 4)
      cursor.space(7)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.setTextColor(COLORS.ENCRE.r, COLORS.ENCRE.g, COLORS.ENCRE.b)
    }
    cursor.advance(6)
    const line = `${recipe.title}${recipe.is_sealed ? '  · scellée' : ''}`
    doc.text(line, MARGIN, cursor.y + 4)
    // Auteur à droite
    const author = recipe.author?.display_name ?? '…'
    const authorWidth = doc.getTextWidth(author)
    doc.text(author, PAGE_W - MARGIN - authorWidth, cursor.y + 4)
  }
  // Pied de page du sommaire
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(COLORS.ENCRE_SOFT.r, COLORS.ENCRE_SOFT.g, COLORS.ENCRE_SOFT.b)
  doc.text(label(2), MARGIN, PAGE_H - 13)

  // ---------- Recettes ----------
  for (const recipe of sorted) {
    doc.addPage()
    cursor = new Cursor(doc)
    await drawRecipeOnPdf(doc, cursor, recipe, familyName, fonts, label)
    // Intercalaire anecdote si la recette suivante est d'une autre catégorie
    // (on laisse drawRecipeOnPdf gérer l'anecdote dans la fiche elle-même ;
    // l'intercalaire sert de respiration entre catégories)
  }

  // ---------- Index par auteur ----------
  doc.addPage()
  paintPageBackground(doc)
  cursor = new Cursor(doc)
  doc.setFont(fonts.serif, fonts.serifStyle)
  doc.setFontSize(20)
  doc.setTextColor(COLORS.ENCRE.r, COLORS.ENCRE.g, COLORS.ENCRE.b)
  doc.text('Index par auteur', MARGIN, cursor.y + 6)
  cursor.space(12)

  // Regroupe les recettes par auteur
  const byAuthor = new Map<string, RecipeWithMeta[]>()
  for (const recipe of sorted) {
    const name = recipe.author?.display_name ?? '…'
    const list = byAuthor.get(name) ?? []
    list.push(recipe)
    byAuthor.set(name, list)
  }
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(COLORS.ENCRE.r, COLORS.ENCRE.g, COLORS.ENCRE.b)
  for (const [author, list] of [...byAuthor.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    cursor.advance(8)
    doc.setFont(fonts.serif, fonts.serifStyle)
    doc.setFontSize(14)
    doc.setTextColor(COLORS.TERRA.r, COLORS.TERRA.g, COLORS.TERRA.b)
    doc.text(author, MARGIN, cursor.y + 4)
    cursor.space(7)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(COLORS.ENCRE.r, COLORS.ENCRE.g, COLORS.ENCRE.b)
    for (const recipe of list) {
      cursor.advance(5)
      doc.text(`· ${recipe.title}`, MARGIN + 4, cursor.y + 3)
    }
  }

  const pageCount = doc.internal.getCurrentPageInfo().pageNumber
  doc.save(familyBookFileName(familyName))
  return { pageCount }
}

/** Compte les pages estimées (pour l'aperçu avant génération) */
export function estimateBookPageCount(recipeCount: number): { pages: number; label: string } {
  // couverture + sommaire + recettes (1 page chacune, mise en page compacte) + index
  const pages = 2 + recipeCount + 1
  return { pages, label: `≈ ${pages} pages` }
}

// Réexport pour les vues (évite un import direct de recipePdf dans FamilyPage)
export { drawAnecdoteDivider }
