/**
 * Mise à l'échelle des quantités d'ingrédients quand on change le nombre
 * de portions. « 200 g de farine » x1,5 -> « 300 g de farine ».
 * Les fractions usuelles sont affichées en caractères simples (½ ¼ ¾).
 */

const FRACTIONS: [number, string][] = [
  [0.25, '¼'],
  [0.5, '½'],
  [0.75, '¾'],
]

function formatNumber(value: number): string {
  const rounded = Math.round(value * 100) / 100
  for (const [decimal, glyph] of FRACTIONS) {
    if (Math.abs(rounded - Math.floor(rounded) - decimal) < 0.01 && Math.floor(rounded) > 0) {
      return `${Math.floor(rounded)} ${glyph}`
    }
  }
  if (Math.abs(rounded - Math.floor(rounded)) < 0.01) return String(Math.floor(rounded))
  // 0.5 isolé (ex: « 0,5 » -> « ½ »)
  for (const [decimal, glyph] of FRACTIONS) {
    if (Math.abs(rounded - decimal) < 0.01) return glyph
  }
  return String(rounded).replace('.', ',')
}

/** Multiplie les nombres d'une ligne d'ingrédient par le facteur de portions */
export function scaleIngredientLine(line: string, factor: number): string {
  if (factor === 1) return line
  return line.replace(/\d+(?:[.,]\d+)?/g, (match) => {
    const value = Number(match.replace(',', '.'))
    if (Number.isNaN(value)) return match
    return formatNumber(value * factor)
  })
}

export function scaleIngredients(ingredients: string[], baseServings: number, targetServings: number): string[] {
  if (baseServings <= 0 || targetServings <= 0) return ingredients
  const factor = targetServings / baseServings
  return ingredients.map((line) => scaleIngredientLine(line, factor))
}
