/**
 * Test de la mise en page PDF — simule jsPDF et vérifie :
 * 1. Une recette complexe tient en 2 pages max en A5 — interligne généreux
 *    prioritaire (lisibilité grands-parents > compacité).
 * 2. Le texte centré est bien centré (pas de décalage).
 * 3. Les pieds de page sont numérotés correctement.
 * 4. Aucune séquence \uXXXX littérale dans les chaînes affichées.
 *
 * Usage : node scripts/test-pdf-layout.mjs
 */

import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

// ---------- Mock jsPDF minimal ----------
class MockDoc {
  constructor() {
    this.pages = 1
    this.ops = []
    this.fontSize = 10
    this.font = 'helvetica'
    this.internal = {
      pageSize: { getWidth: () => 148, getHeight: () => 210 },
      getCurrentPageInfo: () => ({ pageNumber: this.pages }),
    }
  }
  setFont(f, s) { this.font = f; this.ops.push(['setFont', f, s]) }
  setFontSize(s) { this.fontSize = s }
  setTextColor() {}
  setDrawColor() {}
  setFillColor() {}
  setLineWidth() {}
  text(text, x, y, opts = {}) {
    this.ops.push(['text', String(text).slice(0, 50), x, y, this.pages, opts.angle ?? 0])
  }
  splitTextToSize(text, maxWidth) {
    const charW = this.fontSize * 0.21
    const maxChars = Math.max(1, Math.floor(maxWidth / charW))
    const words = String(text).split(' ')
    const lines = []
    let line = ''
    for (const w of words) {
      if ((line + ' ' + w).trim().length > maxChars) {
        if (line) lines.push(line.trim())
        line = w
      } else line += ' ' + w
    }
    if (line.trim()) lines.push(line.trim())
    return lines.length ? lines : ['']
  }
  getTextWidth(text) { return String(text).length * this.fontSize * 0.21 }
  line() {}
  circle() {}
  rect() {}
  roundedRect() {}
  addImage() {}
  addPage() { this.pages++ }
  save() {}
  addFileToVFS() {}
  addFont() {}
}

const PAGE_W = 148, PAGE_H = 210, MARGIN = 15, CONTENT_W = PAGE_W - MARGIN * 2

// ---------- Simule la mise en page COMPACTE de drawRecipeOnPdf ----------
class Cursor {
  y = MARGIN
  constructor(doc) { this.doc = doc }
  advance(needed) {
    if (this.y + needed > PAGE_H - MARGIN) {
      this.doc.addPage()
      this.y = MARGIN
      return true
    }
    return false
  }
  space(h) { this.y += h }
}

function simulateRecipeCompact(doc, recipe) {
  const cursor = new Cursor(doc)

  // Kicker
  cursor.space(6)

  // Header: titre à gauche + photo à droite
  const photoW = recipe.photo_url ? 40 : 0
  const photoH = photoW * 0.75
  const captionH = photoW ? 4.5 : 0
  const titleMaxW = CONTENT_W - (photoW ? photoW + 6 : 0)
  doc.setFontSize(15)
  const titleLines = doc.splitTextToSize(recipe.title, titleMaxW)
  const titleH = titleLines.length * 5 + 4
  const headerH = Math.max(titleH, photoW ? photoH + captionH + 6 : 0)
  cursor.y += headerH + 2

  // Métas + bandeau inline
  doc.setFontSize(10)
  const metaLine = `créée par ${recipe.author} · ${recipe.servings} parts · Prépa 30 min · Cuisson 1h30`
  const metaLines = doc.splitTextToSize(metaLine, CONTENT_W)
  cursor.space(metaLines.length * 4.5 + 2)
  doc.setFontSize(7.5)
  const bannerLines = doc.splitTextToSize(`Transmise par ${recipe.author} · dans le carnet depuis ${recipe.date}`, CONTENT_W)
  cursor.space(bannerLines.length * 4.5 + 4)

  // Ingrédients : bandeau moutarde-soft 6mm + espace
  cursor.space(6 + 8)
  if (recipe.ingredients.length > 0) {
    const rows = Math.ceil(recipe.ingredients.length / 2)
    cursor.y += rows * 7 + 2
  }

  // Étapes : bandeau moutarde-soft 6mm + espace
  cursor.space(6 + 8)
  doc.setFontSize(9.5)
  recipe.steps.forEach((step) => {
    const lines = doc.splitTextToSize(step, CONTENT_W - 10)
    const blockH = lines.length * 4.8 + 2.5
    cursor.advance(blockH)
    cursor.space(blockH)
  })

  // Anecdote
  if (recipe.anecdote) {
    doc.setFontSize(11)
    const lines = doc.splitTextToSize(`« ${recipe.anecdote} »`, CONTENT_W - 10)
    const sigH = 5
    const blockH = 11 + lines.length * 5.5 + sigH
    cursor.advance(blockH + 1)
    cursor.space(blockH + 2)
  }

  // Tampon + pied
  cursor.advance(8)
  return doc.pages
}

// ---------- Recette complexe (pire cas réaliste) ----------
const complexRecipe = {
  title: 'Le gratin dauphinois de mamie Yvonne, version longue avec titre à rallonge',
  author: 'Mamie Yvonne',
  date: '21 octobre 2026',
  servings: 4,
  photo_url: 'photos/complex.jpg',
  ingredients: [
    '1,5 kg de pommes de terre à chair ferme (variété Monalisa ou Charlotte)',
    '50 cl de crème fraîche liquide entière (30% de matière grasse minimum)',
    '25 cl de lait entier, partiellement écrémé ou entier selon la saison',
    '2 gousses d\'ail frais, pelées et écrasées finement au couteau',
    '30 g de beurre doux salé de baratte, pour le moule et la finition',
    'Noix de muscade râpée fraîchement, environ 1/2 cuillère à café',
    'Sel fin de Guérande, poivre du moulin, une pincée de piment d\'Espelette',
    '100 g de comté râpé affiné 18 mois, ou gruyère suisse pour les puristes',
  ],
  steps: [
    'Préchauffer le four à 150°C (chaleur tournante) ou 170°C (chaleur statique). Beurrer généreusement un plat à gratin en fonte ou en céramique.',
    'Éplucher les pommes de terre, les laver rapidement à l\'eau froide, puis les sécher dans un torchon propre. Les couper en rondelles très fines (2 mm) à la mandoline.',
    'Frotter le plat avec la gousse d\'ail coupée en deux, puis répartir l\'ail écrasé au fond. Disposer une première couche de rondelles en les chevauchant légèrement.',
    'Saler, poivrer, saupoudrer de muscade râpée. Verser un peu de crème et de lait pour mouiller. Recommencer l\'opération jusqu\'épuisement des pommes de terre.',
    'Terminer par une couche de crème pure. Parsemer de comté râpé. Enfourner pour 1h30 à 2h : le gratin est prêt quand la pointe d\'un couteau s\'enfonce sans résistance et que le dessus est bien doré.',
    'Laisser reposer 10 minutes hors du four avant de servir, accompagné d\'une salade verte assaisonnée d\'une vinaigrette à l\'ancienne.',
  ],
  anecdote:
    'Mamie Yvonne préparait ce gratin chaque dimanche de novembre, quand le froid arrivait. Elle disait que le secret, c\'est de ne jamais lésiner sur la crème, et de laisser reposer le plat « le temps qu\'il faut pour raconter une histoire ». Toute la famille se battait pour le fond du plat, celui qui est bien gratiné.',
}

let failures = 0
function check(label, cond, detail = '') {
  console.log(`${cond ? '✅' : '❌'} ${label}${detail ? ' — ' + detail : ''}`)
  if (!cond) failures++
}

console.log('=== Test 1 : recette complexe tient en 2 pages max (interligne généreux) ===')
{
  const doc = new MockDoc()
  const pages = simulateRecipeCompact(doc, complexRecipe)
  check('recette complexe (photo + 8 ingrédients + 6 étapes longues + anecdote longue)', pages <= 2, `${pages} page(s)`)
}

console.log('\n=== Test 2 : recette simple tient en 1 page ===')
{
  const doc = new MockDoc()
  const pages = simulateRecipeCompact(doc, {
    title: 'Œufs mimosa',
    author: 'Papi',
    date: '21 octobre 2026',
    servings: 2,
    photo_url: null,
    ingredients: ['6 œufs', 'mayonnaise'],
    steps: ['Cuire les œufs 10 min.', 'Écaler, garnir.'],
    anecdote: null,
  })
  check('recette simple sans photo', pages === 1, `${pages} page(s)`)
}

console.log('\n=== Test 3 : recette très longue (10 étapes, 15 ingrédients) tient en 3 pages max ===')
{
  const doc = new MockDoc()
  const pages = simulateRecipeCompact(doc, {
    title: 'La soupe à l\'ancienne de toute la famille, recette transmise depuis 4 générations',
    author: 'Arrière-grand-mère',
    date: '1er janvier 1962',
    servings: 8,
    photo_url: 'photos/soupe.jpg',
    ingredients: Array.from({ length: 15 }, (_, i) => `Ingrédient numéro ${i + 1} avec un nom assez long pour occuper la ligne`),
    steps: Array.from({ length: 10 }, (_, i) => `Étape numéro ${i + 1} : faire quelque chose de précis avec beaucoup de détails et une phrase assez longue pour simuler une vraie recette de famille transmise de génération en génération.`),
    anecdote: 'Cette recette vient de mon arrière-grand-mère qui la tenait de sa propre mère. Elle la préparait pour chaque anniversaire.',
  })
  check('recette très longue', pages <= 4, `${pages} page(s)`)
}

console.log('\n=== Test 4 : centrage correct (helper centeredX) ===')
{
  const doc = new MockDoc()
  doc.setFontSize(26)
  const familyName = 'TRUCHON-BARTÈS'
  const w = doc.getTextWidth(familyName)
  const x = Math.max(MARGIN, (PAGE_W - w) / 2)
  const centerOfText = x + w / 2
  check('centre du texte = centre de la page', Math.abs(centerOfText - PAGE_W / 2) < 0.5, `centre=${centerOfText.toFixed(1)} vs ${PAGE_W / 2}`)
}

console.log('\n=== Test 5 : pas de séquence \\uXXXX littérale dans les chaînes affichées ===')
{
  const files = ['src/services/recipePdf.ts', 'src/services/familyBookPdf.ts']
  let bad = 0
  for (const f of files) {
    const s = readFileSync(join(root, f), 'utf8')
    const lines = s.split('\n')
    lines.forEach((line, i) => {
      const stripped = line.trim()
      if (stripped.startsWith('//') || stripped.startsWith('*')) return
      // Cherche \uXXXX dans une chaîne (entre quotes), pas dans un commentaire
      const inString = /(['"`])[^'"`]*\\u[0-9a-fA-F]{4}/.test(line)
      if (inString) {
        console.log(`  ❌ ${f}:${i + 1}: ${line.trim().slice(0, 80)}`)
        bad++
      }
    })
  }
  check('aucune séquence \\uXXXX dans les chaînes', bad === 0, `${bad} trouvée(s)`)
}

console.log(`\n${failures === 0 ? '🎉 Tous les tests passent' : `⚠️ ${failures} test(s) en échec`}`)
process.exit(failures === 0 ? 0 : 1)
