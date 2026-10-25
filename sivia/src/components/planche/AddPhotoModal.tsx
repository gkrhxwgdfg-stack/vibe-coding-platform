import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ImagePlus, Send, Trash2, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { addComment } from '@/services/comments'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface AddPhotoModalProps {
  open: boolean
  onClose: () => void
  /** Appelé après une publication réussie (rafraîchit la planche) */
  onPublished?: () => void
}

/**
 * Modal « Ajouter une photo » de la planche familiale : une photo du moment,
 * un commentaire optionnel, et c'est tout. Le moment est rattaché à la
 * famille (pas à une recette) et rejoint la planche de l'accueil.
 */
export function AddPhotoModal({ open, onClose, onPublished }: AddPhotoModalProps) {
  const { profile } = useAuth()
  const [body, setBody] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  // Réinitialise le formulaire à chaque ouverture
  useEffect(() => {
    if (open) {
      setBody('')
      setPhotoFile(null)
      setPhotoPreview(null)
      setError(null)
    }
  }, [open])

  // Fermeture par la touche Échap
  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setPhotoFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onload = () => setPhotoPreview(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setPhotoPreview(null)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!profile?.family_id || !profile.id) {
      setError('Reconnecte-toi pour partager un moment.')
      return
    }
    setSending(true)
    setError(null)
    // recipeId = null : moment de la planche familiale, rattaché à la famille
    const { error: sendError } = await addComment(null, profile.family_id, profile.id, body, photoFile)
    setSending(false)
    if (sendError) {
      setError(sendError)
      return
    }
    onPublished?.()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-encre/40 backdrop-blur-sm p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-photo-title"
        className="card-surface w-full max-w-lg p-6 max-h-[90dvh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="add-photo-title" className="text-2xl font-semibold">
            Ajouter une photo
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Ranger"
            className="min-h-11 min-w-11 rounded-full text-encre-soft hover:text-terra inline-flex items-center justify-center"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="planche-photo"
              className={cn(
                'cursor-pointer w-full min-h-11 inline-flex items-center justify-center gap-2 px-5 rounded-2xl border-2 border-dashed font-bold transition-colors',
                photoFile
                  ? 'border-sauge bg-sauge/10 text-encre'
                  : 'border-encre/25 bg-creme hover:border-terra hover:text-terra',
              )}
            >
              <ImagePlus size={20} aria-hidden="true" />
              {photoFile ? 'Changer la photo' : 'Choisir une photo'}
            </label>
            <input id="planche-photo" type="file" accept="image/*" className="sr-only" onChange={handlePhoto} />
            {photoPreview && (
              <span className="relative inline-block mt-3">
                <img
                  src={photoPreview}
                  alt="Aperçu de la photo"
                  className="w-full max-h-64 object-cover rounded-xl border-2 border-encre/10"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFile(null)
                    setPhotoPreview(null)
                  }}
                  aria-label="Retirer la photo"
                  className="absolute top-2 right-2 min-h-11 min-w-11 rounded-full bg-carmine text-creme flex items-center justify-center"
                >
                  <Trash2 size={18} aria-hidden="true" />
                </button>
              </span>
            )}
          </div>

          <div>
            <label htmlFor="planche-comment" className="block font-bold text-encre mb-1.5">
              Un mot sur ce moment <span className="text-encre-soft font-normal">(facultatif)</span>
            </label>
            <textarea
              id="planche-comment"
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Dimanche chez mamie, la tarte était encore tiède…"
              className="w-full min-h-11 rounded-xl border-2 border-encre/20 bg-creme px-4 py-2.5 text-encre placeholder:text-encre-soft/60 focus:border-terra focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-carmine font-bold" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Ranger
            </Button>
            <Button type="submit" disabled={sending || !photoFile}>
              <Send size={18} aria-hidden="true" />
              {sending ? 'On accroche la photo…' : 'Partager à la famille'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
