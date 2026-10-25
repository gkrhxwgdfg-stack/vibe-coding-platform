import { useState, type FormEvent } from 'react'
import { Check, ImagePlus, MessageCircle, Pencil, Send, Trash2, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useComments } from '@/hooks/useComments'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import { COPY } from '@/lib/copy'
import type { RecipeComment } from '@/lib/types'

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
  const { comments, loading, sending, error, send, remove, edit, commentPhotoUrl } = useComments(recipeId, familyId)

  const [body, setBody] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBody, setEditBody] = useState('')

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

  function startEdit(comment: RecipeComment) {
    setEditingId(comment.id)
    setEditBody(comment.body ?? '')
  }

  async function saveEdit(commentId: string) {
    const { error: editError } = await edit(commentId, editBody)
    if (!editError) {
      setEditingId(null)
      setEditBody('')
    }
  }

  return (
    <section aria-labelledby="comments-title" className="card-surface p-5">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle size={22} className="text-terra-dark" aria-hidden="true" />
        <h2 id="comments-title" className="text-2xl font-semibold">
          La recette vit ici
        </h2>
        <span className="text-sm text-encre-soft font-bold">
          {comments.length === 0 ? 'Aucun message' : `${comments.length} message${comments.length > 1 ? 's' : ''}`}
        </span>
      </div>

      {loading ? (
        <Spinner label={COPY.loading.messages} />
      ) : (
        <ul className="space-y-4 mb-6">
          {comments.length === 0 && (
            <li className="text-encre-soft">
              Personne n'a encore raconté cette recette. Sois le premier — la famille
              suivra.
            </li>
          )}
          {comments.map((comment) => {
            const photo = commentPhotoUrl(comment.photo_url)
            const isMine = comment.author_id === profile?.id
            const isEditing = editingId === comment.id
            return (
              <li key={comment.id} className="flex items-start gap-3">
                {comment.author && (
                  <Avatar name={comment.author.display_name} src={comment.author.avatar_url} size="md" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="rounded-2xl bg-lin px-4 py-3">
                    <p className="font-bold">
                      {comment.author?.display_name ?? '…'}
                      {comment.author?.family_role && (
                        <span className="text-encre-soft font-normal"> · {comment.author.family_role}</span>
                      )}
                    </p>
                    {isEditing ? (
                      <div className="mt-1 space-y-2">
                        <textarea
                          rows={2}
                          value={editBody}
                          onChange={(e) => setEditBody(e.target.value)}
                          className="w-full min-h-11 rounded-xl border-2 border-encre/20 bg-creme px-3 py-2 text-encre placeholder:text-encre-soft/60 focus:border-terra focus:outline-none"
                          aria-label="Modifier mon message"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => saveEdit(comment.id)}
                            className="inline-flex items-center gap-1 min-h-11 px-4 rounded-xl bg-terra-dark text-creme font-bold"
                          >
                            <Check size={16} aria-hidden="true" /> Enregistrer
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null)
                              setEditBody('')
                            }}
                            className="inline-flex items-center gap-1 min-h-11 px-4 rounded-xl border-2 border-encre/25 font-bold hover:border-encre/50"
                          >
                            <X size={16} aria-hidden="true" /> Ranger
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {comment.body && <p className="text-lg whitespace-pre-line mt-0.5">{comment.body}</p>}
                        {photo && (
                          <img
                            src={photo}
                            alt={`Photo partagée par ${comment.author?.display_name ?? 'la famille'}`}
                            loading="lazy"
                            className="mt-2 w-full max-w-xs aspect-[4/3] object-cover rounded-xl border-2 border-encre/10"
                          />
                        )}
                      </>
                    )}
                  </div>
                  <p className="text-sm text-encre-soft mt-1 px-1">
                    {formatRelative(comment.created_at)}
                  </p>
                </div>
                {isMine && !isEditing && (
                  <div className="flex shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(comment)}
                      aria-label="Modifier mon message"
                      className="touch-target-lg min-h-11 min-w-11 rounded-xl text-encre-soft hover:text-terra-dark inline-flex items-center justify-center"
                    >
                      <Pencil size={18} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(comment.id)}
                      aria-label="Retirer mon message"
                      className="touch-target-lg min-h-11 min-w-11 rounded-xl text-encre-soft hover:text-carmine inline-flex items-center justify-center"
                    >
                      <Trash2 size={18} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        <label htmlFor="comment-body" className="block font-bold text-encre">
          Raconte ta version, ta photo…
        </label>
        <textarea
          id="comment-body"
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Celle de dimanche, avec une touche de thym en plus…"
          className="w-full min-h-11 rounded-xl border-2 border-encre/20 bg-creme px-4 py-2.5 text-encre placeholder:text-encre-soft/60 focus:border-terra focus:outline-none"
        />
        <div className="flex flex-wrap items-center gap-3">
          <label
            htmlFor="comment-photo"
            className={cn(
              'cursor-pointer inline-flex items-center gap-2 min-h-11 px-5 rounded-2xl border-2 border-dashed font-bold transition-colors',
              'border-encre/25 bg-creme hover:border-terra-dark hover:text-terra',
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
                alt="Aperçu de la photo"
                className="w-20 h-20 object-cover rounded-xl border-2 border-encre/10"
              />
              <button
                type="button"
                onClick={() => {
                  setPhotoFile(null)
                  setPhotoPreview(null)
                }}
                aria-label="Retirer la photo"
                className="absolute -top-2 -right-2 touch-target-lg min-h-11 min-w-11 rounded-full bg-carmine text-creme flex items-center justify-center"
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </span>
          )}
          <Button type="submit" disabled={sending || (!body.trim() && !photoFile)} className="ml-auto">
            <Send size={18} aria-hidden="true" />
            {sending ? 'On envoie…' : 'Partager à la famille'}
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
