import { useCallback, useState } from 'react'
import {
  readReadingSize,
  writeReadingSize,
  type ReadingSize,
} from '@/lib/readingSize'

/**
 * État React du réglage « Taille du texte » (chantier 8).
 * La logique (localStorage + classe sur <html>) vit dans lib/readingSize.ts.
 */
export function useReadingSize() {
  const [size, setSizeState] = useState<ReadingSize>(() => readReadingSize())

  const setSize = useCallback((next: ReadingSize) => {
    writeReadingSize(next)
    setSizeState(next)
  }, [])

  return { size, setSize }
}
