interface ConfirmDialogProps {
  /** Fermé par défaut ; les usages conditionnels (cond && <ConfirmDialog …>) n'ont pas besoin de le préciser. */
  open?: boolean
  /** Courte question affichée (« Retirer ? ») */
  title: string
  /** Explication longue, non affichée dans la pastille */
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Confirmation compacte avant toute suppression : elle apparaît juste
 * à côté du bouton corbeille, pas au milieu de l'écran. Petite question,
 * Oui, Non — rien de plus. Jamais rien d'effaçable par accident.
 */
export function ConfirmDialog({
  open = true,
  title,
  confirmLabel = 'Oui',
  cancelLabel = 'Non',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null
  return (
    <span
      role="group"
      aria-label={title}
      className="inline-flex items-center gap-1 rounded-full bg-carte border border-encre-doux/35 shadow-md pl-3 py-1 shrink-0 anim-enter"
    >
      <span className="text-sm font-semibold text-encre whitespace-nowrap">{title}</span>
      <button
        type="button"
        onClick={onCancel}
        className="min-h-9 px-3 rounded-full text-sm text-encre-doux hover:bg-ble-clair"
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        onClick={onConfirm}
        className="min-h-9 px-3 rounded-full bg-tomate text-white text-sm font-bold hover:bg-[#a72f23]"
      >
        {confirmLabel}
      </button>
    </span>
  )
}
