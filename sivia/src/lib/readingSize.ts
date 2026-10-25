/**
 * Grande lecture (chantier 8) — réglage « Taille du texte ».
 * Persisté dans localStorage, classe appliquée sur <html> (.reading-lg /
 * .reading-xl) : toutes les tailles en rem suivent automatiquement.
 */

export type ReadingSize = 'standard' | 'lg' | 'xl'

const STORAGE_KEY = 'sivia:reading-size'

const CLASS_BY_SIZE: Record<ReadingSize, string | null> = {
  standard: null,
  lg: 'reading-lg',
  xl: 'reading-xl',
}

export const READING_SIZES: ReadingSize[] = ['standard', 'lg', 'xl']

export function readingSizeLabel(size: ReadingSize): string {
  switch (size) {
    case 'lg':
      return 'Grande'
    case 'xl':
      return 'Très grande'
    default:
      return 'Standard'
  }
}

export function readReadingSize(): ReadingSize {
  if (typeof window === 'undefined') return 'standard'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'lg' || stored === 'xl' ? stored : 'standard'
}

/** Pose (ou retire) la classe de taille sur <html>. Appelé au boot et à chaque changement. */
export function applyReadingSize(size: ReadingSize): void {
  if (typeof document === 'undefined') return
  document.documentElement.classList.remove('reading-lg', 'reading-xl')
  const cls = CLASS_BY_SIZE[size]
  if (cls) document.documentElement.classList.add(cls)
}

export function writeReadingSize(size: ReadingSize): void {
  if (typeof window === 'undefined') return
  if (size === 'standard') window.localStorage.removeItem(STORAGE_KEY)
  else window.localStorage.setItem(STORAGE_KEY, size)
  applyReadingSize(size)
}
