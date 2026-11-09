import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import type { RecipeComment } from '@/lib/types'

interface EditMomentModalProps {
  moment: RecipeComment | null
  onClose: () => void
  onSaved: (body: string) => Promise<void> | void
}

/**
 * Modifier le mot qui accompagne une photo de la planche familiale.
 * (La photo elle-même ne se remplace pas : on retire le moment et on
 * en repose un neuf — comme un vrai polaroid que l'on redescend.)
 */
export function EditMomentModal({ moment, onClose, onSaved }: EditMomentModalProps) {
  useBodyScrollLock(moment !== null)
  const [body, setBody] = useState(moment?.body ?? '')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setBody(moment?.body ?? '')
    setBusy(false)
  }, [moment])

  if (!moment) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-encre/40 backdrop-blur-sm p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-moment-title"
        className="card-surface w-full max-w-md p-6"
      >
        <h2 id="edit-moment-title" className="font-serif text-2xl font-semibold text-center mb-4">
          Changer le mot du moment
        </h2>
        <label className="block">
          <span className="text-encre-doux font-bold">Le mot qui va avec la photo</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={500}
            className="mt-2 w-full rounded-2xl border-2 border-encre-doux/35 bg-papier p-3 text-lg focus:border-vert focus:outline-none"
            placeholder="Un mot, une date, un souvenir…"
          />
        </label>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={onClose}>
            Ranger
          </Button>
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              await onSaved(body)
              setBusy(false)
            }}
          >
            {busy ? 'On colle le mot…' : 'Enregistrer'}
          </Button>
        </div>
      </div>
    </div>
  )
}
