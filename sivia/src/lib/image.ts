/**
 * Compression d'image côté navigateur, avant tout upload.
 *
 * Une photo de smartphone (3–5 Mo) devient ~200–400 Ko. C'est ce qui garde
 * Sivia légère et peu coûteuse, même pour une famille nombreuse très
 * active (15 personnes qui photographient chaque plat) après 10 ans :
 * le stockage et la bande passante restent maîtrisés.
 *
 * En cas d'échec (format exotique, navigateur ancien), on renvoie le
 * fichier d'origine : l'upload fonctionne quand même, juste plus lourd.
 */
export async function compressImage(
  file: File,
  { maxSide = 1800, quality = 0.82 }: { maxSide?: number; quality?: number } = {},
): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close()
      return file
    }
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', quality)
    })
    if (!blob || blob.size === 0) return file
    // On ne garde la version allégée que si elle est vraiment plus légère
    return blob.size < file.size ? blob : file
  } catch {
    return file
  }
}
