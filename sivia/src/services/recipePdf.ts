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
export const PAGE_W = 148
export const PAGE_H = 210
export const MARGIN = 15
export const CONTENT_W = PAGE_W - MARGIN * 2

// ---------- Palette « Farine & Blé » (tokens §2.1) ----------
export const COLORS = {
  VERT: { r: 46, g: 89, b: 57 },       // structure
  VERT_CLAIR: { r: 231, g: 239, b: 227 },
  TOMATE: { r: 201, g: 58, b: 43 },     // action / émotion
  TOMATE_CLAIR: { r: 250, g: 233, b: 228 },
  BLE: { r: 228, g: 169, b: 60 },       // motifs uniquement, jamais texte
  BLE_CLAIR: { r: 249, g: 239, b: 219 },
  CANNELLE: { r: 138, g: 90, b: 43 },   // line-arts patrimoniaux
  ENCRE: { r: 42, g: 33, b: 27 },
  ENCRE_SOFT: { r: 107, g: 93, b: 79 },
  PAPIER: { r: 253, g: 251, b: 247 },
  BLANC: { r: 255, g: 255, b: 255 },
  /* Alias hérités (familyBookPdf, tampon, etc.) → rôles Farine & Blé */
  TERRA: { r: 201, g: 58, b: 43 },
  CARMINE: { r: 201, g: 58, b: 43 },
  MOUTARDE: { r: 228, g: 169, b: 60 },
  MOUTARDE_SOFT: { r: 249, g: 239, b: 219 },
  SAUGE: { r: 46, g: 89, b: 57 },
  PAPIER_AGE: { r: 231, g: 239, b: 227 },
  CREME: { r: 255, g: 255, b: 255 },
} as const

const ENCRE_SOFT = COLORS.ENCRE_SOFT
const CARMINE = COLORS.CARMINE

/** Zone de sécurité en bas de page : le pied de page reste net du cadre couture */
export const FOOTER_SAFE = 7

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
export async function ensureFonts(doc: JsPdfLike): Promise<boolean> {
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
export interface JsPdfLike {
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

export class Cursor {
  y = MARGIN
  constructor(private doc: JsPdfLike) {}
  /** Avance le curseur, déclenche une nouvelle page si besoin. Retourne true si nouvelle page.
   *  Réserve FOOTER_SAFE mm en bas de page : les pieds de page ne chevauchent
   *  jamais le cadre couture (5 mm) ni le contenu. */
  advance(needed: number): boolean {
    if (this.y + needed > PAGE_H - MARGIN - FOOTER_SAFE) {
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
    doc.text('Savia — le carnet de recettes de famille', MARGIN, PAGE_H - 12)
  }
}

/**
 * Tampon : deux cercles carmine + texte, le tout pivoté de −4°.
 * jsPDF n'a pas de rotation de graphics state simple : on applique la
 * rotation manuellement sur chaque élément (cercles → inchangés, position
 * des textes calculée dans le repère tourné).
 */
export function drawStamp(doc: JsPdfLike, name: string, cx: number, cy: number) {
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
  // Texte centré : jsPDF aligne à gauche par défaut, on décale de la moitié
  // de la largeur mesurée avant d'appliquer la rotation du tampon.
  const label = 'DE LA PART DE'
  const labelX = cx - doc.getTextWidth(label) / 2
  const lp = rotate(labelX, cy - 5)
  doc.text(label, lp.x, lp.y, { angle: -4 })
  doc.setFontSize(10)
  const lines = doc.splitTextToSize(name, 26)
  lines.slice(0, 2).forEach((line, i) => {
    const lineX = cx - doc.getTextWidth(line) / 2
    const p = rotate(lineX, cy + 3 + i * 5)
    doc.text(line, p.x, p.y, { angle: -4 })
  })
}

// ---------- Chargement de la photo en JPEG (CORS depuis Supabase storage) ----------
export async function loadPhotoAsJpeg(url: string): Promise<string | null> {
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
  const fonts = await resolveFonts(doc)
  const cursor = new Cursor(doc)
  await drawRecipeOnPdf(doc, cursor, recipe, familyName, fonts)
  doc.save(recipePdfFileName(recipe, familyName))
}

/** Rectangle à bord pointillé (point de couture) */
export function drawDashedRect(
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
  // Coins « couture » : petit point de couleur aux 4 angles — la couture
  // reste intacte (plus de cercle crème qui coupait le filet).
  doc.setFillColor(color.r, color.g, color.b)
  for (const [cx, cy] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) {
    doc.circle(cx, cy, 0.6, 'F')
  }
}


// ---------- Dessin d'une recette sur le PDF (réutilisé par le carnet familial) ----------

export interface PdfFonts {
  serif: string
  serifStyle: string
  hand: string
  handStyle: string
}

/** Résout les polices à utiliser (embarquées ou fallbacks) */
export async function resolveFonts(doc: JsPdfLike): Promise<PdfFonts> {
  const withFonts = await ensureFonts(doc)
  return {
    serif: withFonts ? 'Fraunces' : 'helvetica',
    serifStyle: withFonts ? 'normal' : 'bold',
    hand: withFonts ? 'Caveat' : 'times',
    handStyle: withFonts ? 'normal' : 'italic',
  }
}

/**
 * Dessine une recette complète sur le PDF en cours (plusieurs pages si besoin).
 * Utilisé par generateRecipePdf (fiche) et generateFamilyBookPdf (carnet).
 * `pageLabel` : pied de page personnalisé (« Carnet {famille} — page N »).
 */
export async function drawRecipeOnPdf(
  doc: JsPdfLike,
  cursor: Cursor,
  recipe: RecipeWithMeta,
  familyName: string,
  fonts: PdfFonts,
  pageLabel?: (pageNumber: number) => string,
): Promise<void> {
  const { serif, serifStyle, hand, handStyle } = fonts
  const meta = categoryMeta(recipe.category)
  const author = recipe.author?.display_name ?? '…'
  const authorRole = recipe.author?.family_role ? ` · ${recipe.author.family_role}` : ''
  const prep = formatDuration(recipe.prep_time)
  const cook = formatDuration(recipe.cook_time)

  // Fond cr\u00e8me de la page
  doc.setFillColor(COLORS.CREME.r, COLORS.CREME.g, COLORS.CREME.b)
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F')

  // Cadre pointill\u00e9 sauge (point de couture) sur toute la page \u2014 style carnet
  drawDashedRect(doc, 5, 5, PAGE_W - 10, PAGE_H - 10, COLORS.SAUGE, 1.2)

  // Kicker
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(COLORS.TERRA.r, COLORS.TERRA.g, COLORS.TERRA.b)
  doc.text(`SAVIA · ${meta.label.toUpperCase()}`, MARGIN, cursor.y + 3)
  cursor.space(6)

  // ---- En-t\u00eate compact : titre \u00e0 gauche, photo \u00e0 droite ----
  const photoUrl = photoPublicUrl(recipe.photo_url)
  let photoJpeg: string | null = null
  if (photoUrl) photoJpeg = await loadPhotoAsJpeg(photoUrl)
  const photoW = photoJpeg ? 40 : 0
  const photoH = photoW * 0.75
  const captionH = photoJpeg ? 4.5 : 0
  const titleMaxW = CONTENT_W - (photoJpeg ? photoW + 6 : 0)

  doc.setFont(serif, serifStyle)
  doc.setFontSize(15)
  doc.setTextColor(COLORS.ENCRE.r, COLORS.ENCRE.g, COLORS.ENCRE.b)
  const titleLines = doc.splitTextToSize(recipe.title, titleMaxW)
  const titleH = titleLines.length * 5 + 4
  const headerH = Math.max(titleH, photoJpeg ? photoH + captionH + 6 : 0)
  const headerY = cursor.y
  titleLines.forEach((line, i) => {
    doc.text(line, MARGIN, headerY + 4 + i * 5)
  })

  // Photo polaro\u00efd compacte, \u00e0 droite de l'en-t\u00eate
  if (photoJpeg) {
    const px = PAGE_W - MARGIN - photoW
    doc.setFillColor(COLORS.BLANC.r, COLORS.BLANC.g, COLORS.BLANC.b)
    doc.setDrawColor(200, 190, 175)
    doc.setLineWidth(0.3)
    doc.roundedRect(px - 2, headerY - 2, photoW + 4, photoH + captionH + 4, 1, 1, 'FD')
    try {
      doc.addImage(photoJpeg, 'JPEG', px, headerY, photoW, photoH)
    } catch {
      // image illisible : cadre vide
    }
    // L\u00e9gende manuscrite sous la photo (style polaroid)
    doc.setFont(hand, handStyle)
    doc.setFontSize(8)
    doc.setTextColor(COLORS.ENCRE_SOFT.r, COLORS.ENCRE_SOFT.g, COLORS.ENCRE_SOFT.b)
    const caption = doc.splitTextToSize(recipe.title, photoW)[0]
    doc.text(caption, px + photoW / 2 - doc.getTextWidth(caption) / 2, headerY + photoH + 2.5)
  }
  cursor.y = headerY + headerH + 2

  // M\u00e9tas en ligne (auteur, parts, temps) + bandeau transmission inline
  doc.setFont(hand, handStyle)
  doc.setFontSize(10)
  doc.setTextColor(COLORS.ENCRE_SOFT.r, COLORS.ENCRE_SOFT.g, COLORS.ENCRE_SOFT.b)
  const metaLine = [`créée par ${author}${authorRole}`, `${recipe.servings} part${recipe.servings > 1 ? 's' : ''}`, prep ? `Prépa ${prep}` : null, cook ? `Cuisson ${cook}` : null]
    .filter(Boolean)
    .join('  ·  ')
  doc.splitTextToSize(metaLine, CONTENT_W).forEach((line, i) => {
    doc.text(line, MARGIN, cursor.y + 3.5 + i * 4.5)
  })
  cursor.space(6)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(COLORS.TERRA.r, COLORS.TERRA.g, COLORS.TERRA.b)
  const bannerText = `Transmise par ${author} · dans le carnet depuis ${formatDate(recipe.created_at)}`
  doc.splitTextToSize(bannerText, CONTENT_W).forEach((line, i) => {
    doc.text(line, MARGIN, cursor.y + 3.5 + i * 4.5)
  })
  cursor.space(7.5)

  // Ingr\u00e9dients : titre sur bandeau moutarde, puis 2 colonnes compactes
  doc.setFillColor(COLORS.MOUTARDE_SOFT.r, COLORS.MOUTARDE_SOFT.g, COLORS.MOUTARDE_SOFT.b)
  doc.roundedRect(MARGIN, cursor.y, CONTENT_W, 6, 1.5, 1.5, 'F')
  doc.setFont(serif, serifStyle)
  doc.setFontSize(10.5)
  doc.setTextColor(COLORS.ENCRE.r, COLORS.ENCRE.g, COLORS.ENCRE.b)
  doc.text("CE QU'IL FAUT", MARGIN + 3, cursor.y + 4.2)
  cursor.space(8)

  if (recipe.ingredients.length > 0) {
    const colW = (CONTENT_W - 4) / 2
    const lineH = 4.5
    const rows = Math.ceil(recipe.ingredients.length / 2)
    const rowH = 7
    const startY = cursor.y
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(COLORS.ENCRE.r, COLORS.ENCRE.g, COLORS.ENCRE.b)
    const drawCol = (lines: string[], x: number) => {
      lines.forEach((line, i) => {
        const wrapped = doc.splitTextToSize(line, colW - 5)
        const rowY = startY + i * rowH
        doc.setFillColor(COLORS.TERRA.r, COLORS.TERRA.g, COLORS.TERRA.b)
        doc.circle(x + 1.2, rowY + 2, 0.9, 'F')
        wrapped.forEach((w, wi) => {
          doc.text(w, x + 3.5, rowY + 3 + wi * lineH)
        })
      })
    }
    drawCol(recipe.ingredients.slice(0, rows), MARGIN)
    drawCol(recipe.ingredients.slice(rows), MARGIN + colW + 4)
    cursor.y = startY + rows * rowH + 2
  }

  // \u00c9tapes : titre sur bandeau moutarde, puis \u00e9tapes num\u00e9rot\u00e9es compactes
  doc.setFillColor(COLORS.MOUTARDE_SOFT.r, COLORS.MOUTARDE_SOFT.g, COLORS.MOUTARDE_SOFT.b)
  doc.roundedRect(MARGIN, cursor.y, CONTENT_W, 6, 1.5, 1.5, 'F')
  doc.setFont(serif, serifStyle)
  doc.setFontSize(10.5)
  doc.setTextColor(COLORS.ENCRE.r, COLORS.ENCRE.g, COLORS.ENCRE.b)
  doc.text('LA RECETTE, ÉTAPE PAR ÉTAPE', MARGIN + 3, cursor.y + 4.2)
  cursor.space(8)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  const STEP_LH = 4.8
  const STEP_GAP = 2.5
  recipe.steps.forEach((step, i) => {
    const lines = doc.splitTextToSize(step, CONTENT_W - 10)
    const blockH = lines.length * STEP_LH + STEP_GAP
    cursor.advance(blockH)
    doc.setFillColor(COLORS.TERRA.r, COLORS.TERRA.g, COLORS.TERRA.b)
    doc.circle(MARGIN + 3.5, cursor.y + 2.5, 2.6, 'F')
    doc.setTextColor(COLORS.CREME.r, COLORS.CREME.g, COLORS.CREME.b)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text(String(i + 1), MARGIN + 3.5, cursor.y + 3.5)
    doc.setTextColor(COLORS.ENCRE.r, COLORS.ENCRE.g, COLORS.ENCRE.b)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    lines.forEach((line, li) => {
      doc.text(line, MARGIN + 10, cursor.y + 3 + li * STEP_LH)
    })
    cursor.space(blockH)
  })

  // Anecdote sur fond papier-\u00e2g\u00e9 (compacte)
  if (recipe.anecdote) {
    doc.setFont(hand, handStyle)
    doc.setFontSize(11)
    const anecdoteLines = doc.splitTextToSize(`« ${recipe.anecdote} »`, CONTENT_W - 10)
    const ANECDOTE_LH = 5.5
    const sigH = 5
    const blockH = 11 + anecdoteLines.length * ANECDOTE_LH + sigH
    cursor.advance(blockH + 1)
    doc.setFillColor(COLORS.PAPIER_AGE.r, COLORS.PAPIER_AGE.g, COLORS.PAPIER_AGE.b)
    doc.roundedRect(MARGIN, cursor.y, CONTENT_W, blockH, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(COLORS.TERRA.r, COLORS.TERRA.g, COLORS.TERRA.b)
    doc.text('LE SECRET', MARGIN + 4, cursor.y + 5.5)
    doc.setFont(hand, handStyle)
    doc.setFontSize(11)
    doc.setTextColor(91, 70, 50)
    anecdoteLines.forEach((line, i) => {
      doc.text(line, MARGIN + 5, cursor.y + 12 + i * ANECDOTE_LH)
    })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(COLORS.ENCRE_SOFT.r, COLORS.ENCRE_SOFT.g, COLORS.ENCRE_SOFT.b)
    doc.text(`— ${author}`, MARGIN + 5, cursor.y + 12 + anecdoteLines.length * ANECDOTE_LH + 1)
    cursor.space(blockH + 2)
  }

  // Tampon + pied de page famille : zone réservée, jamais superposée au texte
  // Le tampon (rayon 16) a besoin de 34 mm de hauteur ; on garantit la place
  // sur la page courante avant de le dessiner, et le pied de gauche est limité
  // en largeur pour ne jamais toucher le tampon.
  const STAMP_R = 16
  const stampZoneH = STAMP_R * 2 + 4
  cursor.advance(stampZoneH + 2)
  const stampCy = cursor.y + STAMP_R
  drawStamp(doc, author, PAGE_W - MARGIN - STAMP_R, stampCy)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(COLORS.ENCRE_SOFT.r, COLORS.ENCRE_SOFT.g, COLORS.ENCRE_SOFT.b)
  const familyLine = `Savia — le carnet de la famille ${familyName}`
  const familyLines = doc.splitTextToSize(familyLine, CONTENT_W - stampZoneH)
  familyLines.forEach((line, i) => {
    doc.text(line, MARGIN, cursor.y + 4 + i * 3.5)
  })
  cursor.space(stampZoneH + 2)

  // Pied de page num\u00e9rot\u00e9
  const pageNumber = doc.internal.getCurrentPageInfo().pageNumber
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(COLORS.ENCRE_SOFT.r, COLORS.ENCRE_SOFT.g, COLORS.ENCRE_SOFT.b)
  const label = pageLabel ? pageLabel(pageNumber) : `Savia — le carnet de recettes de famille · page ${pageNumber}`
  doc.text(label, MARGIN, PAGE_H - 12)
}
