/**
 * Génère les images binaires du site à partir des SVG de public/.
 * Le connecteur GitHub ne pousse que du texte : les PNG (og-image,
 * icônes PWA, apple-touch-icon) sont donc rasterisés en CI via sharp.
 * Résilient : si la police Fraunces n'a pas pu être installée, le SVG
 * retombe sur DejaVu Serif (toujours présent sur les runners Ubuntu).
 */
import sharp from 'sharp'

const jobs = [
  ['public/og-image.svg', 'dist/og-image.png', 1200, 630],
  ['public/icon.svg', 'dist/icon-192.png', 192, 192],
  ['public/icon.svg', 'dist/icon-512.png', 512, 512],
  ['public/icon.svg', 'dist/apple-touch-icon.png', 180, 180],
]

for (const [src, out, width, height] of jobs) {
  await sharp(src).resize({ width, height }).png().toFile(out)
  console.log('✓', out)
}
