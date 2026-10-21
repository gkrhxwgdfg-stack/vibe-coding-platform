import { useState, type FormEvent } from 'react'
import { ImagePlus, MessageCircle, Send, Trash2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useComments } from '@/hooks/useComments'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'

interface CommentThreadProps {
  recipeId: string
  familyId: string
}

/**
 * Fil de vie d'une recette : la famille commente et partage ses photos.
 * Fait perdurer la recette, on voit qui l'a faite, quand, et ce qu'on en dit.
 */
export function CommentThread({ recipeId, familyId }: CommentThreadProps) {
  const { profile } = useAuth()
  const { comments, loading, sending, error, send, remove, commentPhotoUrl } = useComments(recipeId, familyId)

  const [body, setBody] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

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
    const { error: sendError } = await send(body, photoFile)
    if (!sendError) {
      setBody('')
      setPhotoFile(null)
      setPhotoPreview(null)
    }
  }

  return (
    <section aria-labelledby="comments-title" className="card-surface p-5">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle size={22} className="text-terra" aria-hidden="true" />
        <h2 id="comments-title" className="text-2xl font-semibold">
          La recette vit ici
        </h2>
        <span className="text-sm text-encre-soft font-bold">
          {comments.length} message{comments.length > 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <Spinner label="On rassemble les messages de la famille…" />
      ) : (
        <ul className="space-y-4 mb-6">
          {comments.length === 0 && (
            <li className="text-encre-soft">
              Personne n'a encore racont\u00e9 cette recette. Sois le premier \u2014 la famille
              suivra.
            </li>
          )}
          {comments.map((comment) => {
            const photo = commentPhotoUrl(comment.photo_url)
            const isMine = comment.author_id === profile?.id
            return (
              <li key={comment.id} className="flex items-start gap-3">
                {comment.author && (
                  <Avatar name={comment.author.display_name} src={comment.author.avatar_url} size="md" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="rounded-2xl bg-lin px-4 py-3">
                    <p className="font-bold">
                      {comment.author?.display_name ?? '\u2026'}
                      {comment.author?.family_role && (
                        <span className="text-encre-soft font-normal"> \u00b7 {comment.author.family_role}</span>
                      )}
                    </p>
                    {comment.body && <p className="text-lg whitespace-pre-line mt-0.5">{comment.body}</p>}
                    {photo && (
                      <img
                        src={photo}
                        alt={`Photo partag\u00e9e par ${comment.author?.display_name ?? 'la famille'}`}
                        loading="lazy"
                        className="mt-2 w-full max-w-xs aspect-[4/3] object-cover rounded-xl border-2 border-encre/10"
                      />
                    )}
                  </div>
                  <p className="text-xs text-encre-soft mt-1 px-1">
                    {formatRelative(comment.created_at)}
                  </p>
                </div>
                {isMine && (
                  <button
                    type="button"
                    onClick={() => remove(comment.id)}
                    aria-label="Retirer mon message"
                    className="min-h-11 min-w-11 shrink-0 rounded-xl text-encre-soft hover:text-carmine inline-flex items-center justify-center"
                  >
                    <Trash2 size={18} aria-hidden="true" />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        <label htmlFor="comment-body" className="block font-bold text-encre">
          Raconte ta version, ta photo\u2026
        </label>
        <textarea
          id="comment-body"
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Celle de dimanche, avec une touche de thym en plus\u2026"
          className="w-full min-h-11 rounded-xl border-2 border-encre/20 bg-creme px-4 py-2.5 text-encre placeholder:text-encre-soft/60 focus:border-terra focus:outline-none"
        />
        <div className="flex flex-wrap items-center gap-3">
          <label
            htmlFor="comment-photo"
            className={cn(
              'cursor-pointer inline-flex items-center gap-2 min-h-11 px-5 rounded-2xl border-2 border-dashed font-bold transition-colors',
              'border-encre/25 bg-creme hover:border-terra hover:text-terra',
            )}
          >
            <ImagePlus size={20} aria-hidden="true" />
            {photoPreview ? 'Changer la photo' : 'Ajouter une photo'}
          </label>
          <input id="comment-photo" type="file" accept="image/*" className="sr-only" onChange={handlePhoto} />
          {photoPreview && (
            <span className="relative inline-block">
              <img
                src={photoPreview}
                alt="Aper\u00e7u de la photo"
                className="w-20 h-20 object-cover rounded-xl border-2 border-encre/10"
              />
              <button
                type="button"
                onClick={() => {
                  setPhotoFile(null)
                  setPhotoPreview(null)
                }}
                aria-label="Retirer la photo"
                className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-carmine text-creme flex items-center justify-center"
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </span>
          )}
          <Button type="submit" disabled={sending || (!body.trim() && !photoFile)} className="ml-auto">
            <Send size={18} aria-hidden="true" />
            {sending ? 'On envoie\u2026' : 'Envoyer'}
          </Button>
        </div>
        {error && (
          <p className="text-carmine font-bold" role="alert">
            {error}
          </p>
        )}
      </form>
    </section>
  )
}
