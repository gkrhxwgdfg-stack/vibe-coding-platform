import type { ReactNode } from 'react'
import { Card } from './Card'

interface EmptyStateProps {
  /** Phrase manuscrite, ex: « Toute famille a une première recette. » */
  handText: string
  children?: ReactNode
}

/** État vide chaleureux : une phrase à la main, une action en dessous */
export function EmptyState({ handText, children }: EmptyStateProps) {
  return (
    <Card className="text-center py-10">
      <p className="text-hand text-bleu text-3xl mb-4">{handText}</p>
      {children}
    </Card>
  )
}
