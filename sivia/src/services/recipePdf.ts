import type { RecipeWithMeta } from '@/lib/types'
import { categoryMeta } from '@/lib/constants'
import { formatDate, formatDuration } from '@/lib/format'
import { photoPublicUrl } from '@/services/recipes'

/**
 * Export PDF d'une recette (fiche A5) — jsPDF, importé dynamiquement au clic
 * pour ne pas alourdir le bundle initial.
 *
 * Composition : titre (Fraunces ou fallback Helvetica-Bold), photo polaroïd
 * (JPEG depuis Supabase storage), bandeau transmission, ingrédients en
 * 2 colonnes, étapes numérotées, anecdote (Caveat ou fallback Times-Italic)
 * sur fond papier-âgé, tampon (cercles + rotation −4°) et pied de page famille.
 * Multi-pages propres si la recette dépasse une page.
 *
 * Nom de fichier : `savia—{titre}—{famille}.pdf` (tirets sûrs, pas d'accents).
 */

// ---------- Constantes A5 (mm) ----------
const PAGE_W = 148
const PAGE_H = 210
const MARGIN = 15
const CONTENT_W = PAGE_W - MARGIN * 2

// ---------- Palette Savia ----------
const TERRA = { r: 196, g: 100, b: 58 }
const ENCRE = { r: 74, g: 55, b: 40 }
const ENCRE_SOFT = { r: 107, g: 74, b: 50 }
const CREME = { r: 251, g: 246, b: 236 }
const PAPIER_AGE = { r: 243, g: 234, b: 217 }
const CARMINE = { r: 179, g: 59, b: 59 }
const BLANC = { r: 255, g: 255, b: 255 }

type RGB = { r: number; g: number; b: number }

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/** Nom de fichier sûr : savia—{titre}—{famille}.pdf */
export function recipePdfFileName(recipe: RecipeWithMeta, familyName: string): string {
  return `savia—${slugify(recipe.title)}—${slugify(familyName)}.pdf`
}

// ---------- Polices embarquées (préchargées au premier export) ----------

let fontsReady: Promise<boolean> | null = null

/**
 * Charge Fraunces + Caveat en TTF depuis /public/fonts et les embarque dans
 * le VFS de jsPDF (`addFileToVFS`). Sans les fichiers, retour `false` et le
 * PDF retombe sur Helvetica-Bold / Times-Italic. Appelé une seule fois.
 */
async function ensureFonts(doc: JsPdfLike): Promise<boolean> {
  if (fontsReady) return fontsReady
  fontsReady = (async () => {
    try {
      const load = async (name: string) => {
        const res = await fetch(`/fonts/${name}`)
        if (!res.ok) throw new Error('font not found')
        return await res.arrayBuffer()
      }
      const [fraunces, caveat] = await Promise.all([
        load('Fraunces-Regular.ttf'),
        load('Caveat-Regular.ttf'),
      ])
      doc.addFileToVFS('Fraunces-Regular.ttf', arrayBufferToBase64(fraunces))
      doc.addFont('Fraunces-Regular.ttf', 'Fraunces', 'normal')
      doc.addFileToVFS('Caveat-Regular.ttf', arrayBufferToBase64(caveat))
      doc.addFont('Caveat-Regular.ttf', 'Caveat', 'normal')
      return true
    } catch {
      return false
    }
  })()
  return fontsReady
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

// ---------- Typage minimal de jsPDF (évite de lier le type au module ici) ----------
interface JsPdfLike {
  addFileToVFS: (name: string, data: string) => void
  addFont: (name: string, family: string, style: string) => void
  setFont: (family: string, style: string) => void
  setFontSize: (size: number) => void
  setTextColor: (r: number, g: number, b: number) => void
  setDrawColor: (r: number, g: number, b: number) => void
  setFillColor: (r: number, g: number, b: number) => void
  setLineWidth: (w: number) => void
  text: (text: string | string[], x: number, y: number, options?: { angle?: number; maxWidth?: number; lineHeightFactor?: number }) => void
  splitTextToSize: (text: string, maxWidth: number) => string[]
  getTextWidth: (text: string) => number
  line: (x1: number, y1: number, x2: number, y2: number) => void
  circle: (x: number, y: number, r: number, style?: string) => void
  rect: (x: number, y: number, w: number, h: number, style?: string) => void
  roundedRect: (x: number, y: number, w: number, h: number, rx: number, ry: number, style?: string) => void
  addImage: (data: string, format: string, x: number, y: number, w: number, h: number) => void
  addPage: () => void
  save: (name: string) => void
  internal: {
    pageSize: { getWidth: () => number; getHeight: () => number }
    getCurrentPageInfo: () => { pageNumber: number }
  }
}

// ---------- Petits helpers de mise en page ----------

class Cursor {
  y = MARGIN
  constructor(private doc: JsPdfLike) {}
  /** Avance le curseur, déclenche une nouvelle page si besoin. Retourne true si nouvelle page. */
  advance(needed: number): boolean {
    if (this.y + needed > PAGE_H - MARGIN) {
      this.doc.addPage()
      this.footer()
      this.y = MARGIN
      return true
    }
    return false
  }
  /** Espace vertical, avec retour à la page suivante si besoin */
  space(height: number) {
    this.y += height
  }
  footer() {
    const doc = this.doc
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(ENCRE_SOFT.r, ENCRE_SOFT.g, ENCRE_SOFT.b)
    doc.text('Savia — le carnet de recettes de famille', MARGIN, PAGE_H - 8)
  }
}

/**
 * Tampon : deux cercles carmine + texte, le tout pivoté de −4°.
 * jsPDF n'a pas de rotation de graphics state simple : on applique la
 * rotation manuellement sur chaque élément (cercles → inchangés, position
 * des textes calculée dans le repère tourné).
 */
function drawStamp(doc: JsPdfLike, name: string, cx: number, cy: number) {
  const angle = (-4 * Math.PI) / 180
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  /** Tourne un point autour du centre du tampon */
  const rotate = (px: number, py: number) => ({
    x: cx + (px - cx) * cos - (py - cy) * sin,
    y: cy + (px - cx) * sin + (py - cy) * cos,
  })

  doc.setDrawColor(CARMINE.r, CARMINE.g, CARMINE.b)
  doc.setLineWidth(0.8)
  doc.circle(cx, cy, 16)
  doc.setLineWidth(0.5)
  // Cercle intérieur pointillé (12 petits points)
  doc.setFillColor(CARMINE.r, CARMINE.g, CARMINE.b)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    doc.circle(cx + Math.cos(a) * 13, cy + Math.sin(a) * 13, 0.4, 'F')
  }
  doc.setTextColor(CARMINE.r, CARMINE.g, CARMINE.b)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6)
  const small = rotate(cx, cy - 5)
  doc.text('DE LA PART DE', small.x, small.y, { angle: -4 })
  doc.setFontSize(10)
  const lines = doc.splitTextToSize(name, 26)
  lines.slice(0, 2).forEach((line, i) => {
    const p = rotate(cx, cy + 2 + i * 4)
    doc.text(line, p.x, p.y, { angle: -4 })
  })
}

// ---------- Chargement de la photo en JPEG (CORS depuis Supabase storage) ----------
async function loadPhotoAsJpeg(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

// ---------- Génération du PDF ----------

/**
 * Génère le PDF A5 d'une recette et le télécharge.
 * Import dynamique de jsPDF : le bundle ne le charge qu'au clic d'export.
 */
export async function generateRecipePdf(recipe: RecipeWithMeta, familyName: string): Promise<void> {
  const { default: JsPDF } = await import('jspdf')
  const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' }) as unknown as JsPdfLike

  const withFonts = await ensureFonts(doc)
  const serif = withFonts ? 'Fraunces' : 'helvetica'
  const serifStyle = withFonts ? 'normal' : 'bold'
  const hand = withFonts ? 'Caveat' : 'times'
  const handStyle = withFonts ? 'normal' : 'italic'

  const cursor = new Cursor(doc)
  const meta = categoryMeta(recipe.category)
  const author = recipe.author?.display_name ?? '…'
  const authorRole = recipe.author?.family_role ? ` · ${recipe.author.family_role}` : ''
  const prep = formatDuration(recipe.prep_time)
  const cook = formatDuration(recipe.cook_time)

  // --- Fond crème de la page ---
  doc.setFillColor(CREME.r, CREME.g, CREME.b)
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F')

  // --- Kicker + titre ---
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(TERRA.r, TERRA.g, TERRA.b)
  doc.text(`SAVIA · ${meta.label.toUpperCase()}`, MARGIN, cursor.y + 4)
  cursor.space(8)

  doc.setFont(serif, serifStyle)
  doc.setFontSize(24)
  doc.setTextColor(ENCRE.r, ENCRE.g, ENCRE.b)
  const titleLines = doc.splitTextToSize(recipe.title, CONTENT_W)
  titleLines.forEach((line) => {
    doc.text(line, MARGIN, cursor.y + 6)
    cursor.space(8)
  })
  cursor.space(2)

  // --- Byline manuscrite ---
  doc.setFont(hand, handStyle)
  doc.setFontSize(14)
  doc.setTextColor(ENCRE_SOFT.r, ENCRE_SOFT.g, ENCRE_SOFT.b)
  doc.text(`créée par ${author}${authorRole}`, MARGIN, cursor.y + 4)
  cursor.space(8)

  // --- Méta : portions, temps ---
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(ENCRE_SOFT.r, ENCRE_SOFT.g, ENCRE_SOFT.b)
  const metaLine = [
    `${recipe.servings} part${recipe.servings > 1 ? 's' : ''}`,
    prep ? `Prépa ${prep}` : null,
    cook ? `Cuisson ${cook}` : null,
  ].filter(Boolean).join('  ·  ')
  doc.text(metaLine, MARGIN, cursor.y + 4)
  cursor.space(10)

  // --- Photo polaroïd ---
  const photoUrl = photoPublicUrl(recipe.photo_url)
  if (photoUrl) {
    const jpeg = await loadPhotoAsJpeg(photoUrl)
    if (jpeg) {
      const polaroidW = 90
      const imgH = polaroidW * 0.75
      const x = (PAGE_W - polaroidW) / 2
      cursor.advance(imgH + 26)
      // Cadre polaroïd blanc
      doc.setFillColor(BLANC.r, BLANC.g, BLANC.b)
      doc.setDrawColor(200, 190, 175)
      doc.setLineWidth(0.3)
      doc.roundedRect(x - 3, cursor.y - 3, polaroidW + 6, imgH + 22, 1.5, 1.5, 'FD')
      try {
        doc.addImage(jpeg, 'JPEG', x, cursor.y, polaroidW, imgH)
      } catch {
        // image illisible : on laisse le cadre vide
      }
      doc.setFont(hand, handStyle)
      doc.setFontSize(12)
      doc.setTextColor(ENCRE_SOFT.r, ENCRE_SOFT.g, ENCRE_SOFT.b)
      doc.text(recipe.title, PAGE_W / 2, cursor.y + imgH + 8, { angle: -2 })
      cursor.space(imgH + 16)
    }
  }

  // --- Bandeau transmission (point de couture) ---
  const bannerText = `Transmise par ${author} · dans le carnet depuis ${formatDate(recipe.created_at)}`
  const bannerLines = doc.splitTextToSize(bannerText, CONTENT_W - 8)
  const bannerH = bannerLines.length * 4.5 + 8
  cursor.advance(bannerH + 4)
  doc.setDrawColor(TERRA.r, TERRA.g, TERRA.b)
  doc.setLineWidth(0.4)
  doc.setFillColor(CREME.r, CREME.g, CREME.b)
  // Bord pointillé : lignes de petits tirets
  drawDashedRect(doc, MARGIN, cursor.y, CONTENT_W, bannerH, TERRA, 1.5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(ENCRE.r, ENCRE.g, ENCRE.b)
  bannerLines.forEach((line, i) => {
    doc.text(line, MARGIN + 4, cursor.y + 6 + i * 4.5)
  })
  cursor.space(bannerH + 8)

  // --- Ingrédients : 2 colonnes ---
  cursor.advance(10)
  doc.setFont(serif, serifStyle)
  doc.setFontSize(15)
  doc.setTextColor(ENCRE.r, ENCRE.g, ENCRE.b)
  doc.text('Ce qu\'il faut', MARGIN, cursor.y + 5)
  cursor.space(9)

  if (recipe.ingredients.length > 0) {
    const colW = (CONTENT_W - 6) / 2
    const lineH = 5
    const rows = Math.ceil(recipe.ingredients.length / 2)
    const col1 = recipe.ingredients.slice(0, rows)
    const col2 = recipe.ingredients.slice(rows)
    const blockH = rows * lineH + 4
    cursor.advance(blockH)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(ENCRE.r, ENCRE.g, ENCRE.b)
    const drawCol = (lines: string[], x: number) => {
      lines.forEach((line, i) => {
        // Puce terracotta
        doc.setFillColor(TERRA.r, TERRA.g, TERRA.b)
        doc.circle(x + 1.5, cursor.y + 2 + i * lineH - 1.2, 1, 'F')
        const wrapped = doc.splitTextToSize(line, colW - 6)
        wrapped.forEach((w, wi) => {
          doc.text(w, x + 4, cursor.y + 2 + i * lineH + wi * 4)
        })
      })
    }
    const startY = cursor.y
    drawCol(col1, MARGIN)
    drawCol(col2, MARGIN + colW + 6)
    cursor.y = startY + blockH
    cursor.space(6)
  }

  // --- Étapes numérotées ---
  cursor.advance(10)
  doc.setFont(serif, serifStyle)
  doc.setFontSize(15)
  doc.setTextColor(ENCRE.r, ENCRE.g, ENCRE.b)
  doc.text('La recette, étape par étape', MARGIN, cursor.y + 5)
  cursor.space(10)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10.5)
  recipe.steps.forEach((step, i) => {
    const lines = doc.splitTextToSize(step, CONTENT_W - 14)
    const blockH = lines.length * 4.8 + 4
    cursor.advance(blockH)
    // Numéro dans un cercle terracotta
    doc.setFillColor(TERRA.r, TERRA.g, TERRA.b)
    doc.circle(MARGIN + 4, cursor.y + 2, 3.2, 'F')
    doc.setTextColor(CREME.r, CREME.g, CREME.b)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(String(i + 1), MARGIN + 4, cursor.y + 3.2)
    doc.setTextColor(ENCRE.r, ENCRE.g, ENCRE.b)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10.5)
    lines.forEach((line, li) => {
      doc.text(line, MARGIN + 12, cursor.y + 3 + li * 4.8)
    })
    cursor.space(blockH)
  })
  cursor.space(4)

  // --- Anecdote sur fond papier-âgé ---
  if (recipe.anecdote) {
    doc.setFont(hand, handStyle)
    doc.setFontSize(14)
    const anecdoteLines = doc.splitTextToSize(`« ${recipe.anecdote} »`, CONTENT_W - 12)
    const blockH = anecdoteLines.length * 6 + 16
    cursor.advance(blockH + 4)
    doc.setFillColor(PAPIER_AGE.r, PAPIER_AGE.g, PAPIER_AGE.b)
    doc.roundedRect(MARGIN, cursor.y, CONTENT_W, blockH, 3, 3, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(TERRA.r, TERRA.g, TERRA.b)
    doc.text('LE SECRET — CELUI QU\'ON NE DIT QU\'À LA FAMILLE', MARGIN + 6, cursor.y + 7)
    doc.setFont(hand, handStyle)
    doc.setFontSize(14)
    doc.setTextColor(91, 70, 50)
    anecdoteLines.forEach((line, i) => {
      doc.text(line, MARGIN + 6, cursor.y + 14 + i * 6)
    })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(ENCRE_SOFT.r, ENCRE_SOFT.g, ENCRE_SOFT.b)
    doc.text(`— ${author}`, MARGIN + 6, cursor.y + blockH - 4)
    cursor.space(blockH + 8)
  }

  // --- Tampon + pied de page famille ---
  cursor.advance(30)
  drawStamp(doc, author, PAGE_W - MARGIN - 20, cursor.y + 12)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(ENCRE_SOFT.r, ENCRE_SOFT.g, ENCRE_SOFT.b)
  doc.text(`Savia — le carnet de la famille ${familyName}`, MARGIN, cursor.y + 8)
  doc.setFont(hand, handStyle)
  doc.setFontSize(12)
  doc.setTextColor(TERRA.r, TERRA.g, TERRA.b)
  doc.text(`Dans le carnet depuis le ${formatDate(recipe.created_at)}`, MARGIN, cursor.y + 14)

  // Pied de page sur chaque page
  cursor.footer()

  doc.save(recipePdfFileName(recipe, familyName))
}

/** Rectangle à bord pointillé (point de couture) */
function drawDashedRect(
  doc: JsPdfLike,
  x: number,
  y: number,
  w: number,
  h: number,
  color: RGB,
  dashLen: number,
) {
  doc.setDrawColor(color.r, color.g, color.b)
  doc.setLineWidth(0.4)
  const dash = dashLen
  const gap = dashLen * 0.8
  const drawDashedLine = (x1: number, y1: number, x2: number, y2: number) => {
    const len = Math.hypot(x2 - x1, y2 - y1)
    const step = dash + gap
    for (let d = 0; d < len; d += step) {
      const t1 = d / len
      const t2 = Math.min(1, (d + dash) / len)
      doc.line(x1 + (x2 - x1) * t1, y1 + (y2 - y1) * t1, x1 + (x2 - x1) * t2, y1 + (y2 - y1) * t2)
    }
  }
  drawDashedLine(x, y, x + w, y)
  drawDashedLine(x + w, y, x + w, y + h)
  drawDashedLine(x + w, y + h, x, y + h)
  drawDashedLine(x, y + h, x, y)
  // Coins arrondis visuels : petits cercles crème aux coins
  doc.setFillColor(CREME.r, CREME.g, CREME.b)
  for (const [cx, cy] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) {
    doc.circle(cx, cy, 1.2, 'F')
  }
}
