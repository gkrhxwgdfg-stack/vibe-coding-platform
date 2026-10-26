import type { ReactNode } from 'react'
import { Card } from './Card'

interface EmptyStateProps {
  /** Phrase manuscrite (Caveat), ex: « Les chouchous du carnet attendent. » */
  handText: string
  /** Titre affiché au-dessus (défaut : « Le carnet est vide » — surchargé par les pages) */
  title?: string
  children?: ReactNode
}

/**
 * État vide v2 : illustration SVG au trait (carnet entrouvert), titre en
 * Fraunces, phrase d'invitation manuscrite et une seule action.
 */
export function EmptyState({ handText, title = 'Le carnet est vide', children }: EmptyStateProps) {
  return (
    <Card className="text-center py-10 bg-sauge/10 border-sauge/30 anim-enter">
      <svg
        viewBox="0 0 120 80"
        className="mx-auto mb-4 h-20 w-30 text-[#6b4a32]"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {/* Carnet entrouvert, vu de dessus */}
        <path d="M60 18 C45 10, 25 10, 12 16 L12 62 C25 56, 45 56, 60 64 C75 56, 95 56, 108 62 L108 16 C95 10, 75 10, 60 18 Z" />
        <path d="M60 18 L60 64" />
        {/* Traits d'écriture sur la page de gauche */}
        <path d="M24 30 C34 27, 44 27, 52 30" strokeDasharray="1 6" />
        <path d="M24 40 C34 37, 44 37, 52 40" strokeDasharray="1 6" />
        <path d="M24 50 C32 47.5, 40 47.5, 48 50" strokeDasharray="1 6" />
        {/* Un cœur gribouillé sur la page de droite */}
        <path d="M78 38 C78 34, 72 33, 72 38 C72 33, 66 34, 66 38 C66 43, 72 47, 72 47 C72 47, 78 43, 78 38 Z" />
      </svg>
      <h2 className="font-serif text-2xl font-semibold mb-2">{title}</h2>
      <p className="text-hand text-bleu-dark text-3xl mb-5">{handText}</p>
      {children}
    </Card>
  )
}
