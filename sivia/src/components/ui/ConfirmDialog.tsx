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
 * Confirmation compacte avant toute suppression : une petite pastille
 * « question + Oui/Non » posée à côté ou sous le bouton corbeille, jamais
 * au milieu de l'écran. Elle se glisse dans la largeur disponible : le
 * texte se replie sur plusieurs lignes plutôt que de déborder d'un cadre.
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
      className="inline-flex items-center gap-1 rounded-full bg-carte border border-encre-doux/35 shadow-md p-1 shrink-0 anim-enter max-w-full"
    >
      <span className="text-sm font-semibold text-encre break-words min-w-0">{title}</span>
      <button
        type="button"
        onClick={onCancel}
        className="shrink-0 min-h-9 px-2.5 rounded-full text-sm text-encre-doux hover:bg-ble-clair"
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        onClick={onConfirm}
        className="shrink-0 min-h-9 px-2.5 rounded-full bg-tomate text-white text-sm font-bold hover:bg-[#a72f23]"
      >
        {confirmLabel}
      </button>
    </span>
  )
}
