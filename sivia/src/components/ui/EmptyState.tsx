import type { ReactNode } from 'react'
import { Miette } from '@/components/motifs/Miette'
import { Card } from './Card'

interface EmptyStateProps {
  /** Phrase manuscrite (Caveat), ex: « Les chouchous du carnet attendent. » */
  handText: string
  /** Titre affiché au-dessus (défaut : « Le carnet est vide » — surchargé par les pages) */
  title?: string
  children?: ReactNode
}

/**
 * État vide v3 : Miette (la mascotte, étonnée d'un carnet encore vide),
 * titre en Fraunces, phrase d'invitation manuscrite et une seule action.
 */
export function EmptyState({ handText, title = 'Le carnet est vide', children }: EmptyStateProps) {
  return (
    <Card className="text-center py-10 motif-tamis anim-enter">
      <Miette size={72} mood="etonne" className="mx-auto mb-4" />
      <h2 className="font-serif text-2xl font-semibold mb-2">{title}</h2>
      <p className="font-serif italic text-encre-doux text-2xl mb-5">{handText}</p>
      {children}
    </Card>
  )
}
