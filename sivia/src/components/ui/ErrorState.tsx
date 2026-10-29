import { RotateCcw } from 'lucide-react'
import { Card } from './Card'
import { Button } from './Button'
import { COPY } from '@/lib/copy'

interface ErrorStateProps {
  /** Message doux affiché à l'utilisateur (jamais de texte technique brut) */
  message: string
  /** Action de sortie : réessayer, recharger, retourner… */
  onRetry?: () => void
  retryLabel?: string
}

/**
 * État d'erreur récupérable : message rassurant + bouton de sortie.
 * « La sauce a raté. On recommence ? »
 */
export function ErrorState({ message, onRetry, retryLabel = COPY.errors.reessayer }: ErrorStateProps) {
  return (
    <Card className="text-center py-8 border-tomate/30 bg-tomate/5 anim-enter" role="alert">
      <p className="font-serif italic text-tomate text-3xl mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          <RotateCcw size={18} aria-hidden="true" />
          {retryLabel}
        </Button>
      )}
    </Card>
  )
}
