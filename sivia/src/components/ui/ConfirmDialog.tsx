import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { Button } from '@/components/ui/Button'

interface ConfirmDialogProps {
  /** Fermé par défaut ; les usages conditionnels (cond && <ConfirmDialog …>) n'ont pas besoin de le préciser. */
  open?: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Confirmation classique avant toute suppression : un clic sur la
 * corbeille ouvre la question, la famille répond Oui ou Non. Jamais
 * rien d'effacable par accident, jamais de double-clic deviné.
 */
export function ConfirmDialog({
  open = true,
  title,
  message,
  confirmLabel = 'Oui',
  cancelLabel = 'Non',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useBodyScrollLock(open)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className="absolute inset-0 bg-encre/40 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-sm rounded-3xl bg-carte border-2 border-encre-doux/35 p-6 shadow-xl space-y-4 anim-enter">
          <h2 className="font-serif text-2xl font-semibold text-center">{title}</h2>
          <p className="text-lg text-encre-doux text-center">{message}</p>
          <div className="flex gap-3 justify-center pt-2">
            <Button variant="outline" onClick={onCancel}>
              {cancelLabel}
            </Button>
            <Button variant="danger" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
