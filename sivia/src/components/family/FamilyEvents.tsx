import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ImagePlus, Plus, Send, Trash2, X } from 'lucide-react'
import { useFamilyEvents } from '@/hooks/useFamilyTree'
import { useRecipes } from '@/hooks/useRecipes'
import { familyPhotoUrl } from '@/services/familyTree'
import { formatDate } from '@/lib/format'
import { COPY } from '@/lib/copy'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { TextInput, TextArea } from '@/components/ui/FormFields'
import { cn } from '@/lib/utils'

const NO_FILTERS = { query: '', category: 'toutes' as const, authorId: 'tous' as const }

/**
 * Chronologie des repas de famille : chaque événement est un nœud du fil
 * de l'arbre — l'arbre et les souvenirs forment une seule histoire.
 */
export function FamilyEvents() {
  const { events, loading, add, remove } = useFamilyEvents()
  const { recipes } = useRecipes(NO_FILTERS)

  const [open, setOpen] = useState(false)

  // Regroupe les événements par année, du plus récent au plus ancien
  const byYear = new Map<string, typeof events>()
  for (const event of events) {
    const year = event.event_date.slice(0, 4)
    const list = byYear.get(year) ?? []
    list.push(event)
    byYear.set(year, list)
  }
  const years = [...byYear.keys()].sort((a, b) => Number(b) - Number(a))

  return (
    <section aria-labelledby="events-title">
      <CardHeader
        kicker="Les souvenirs"
        title="Nos repas de famille"
        action={
          <Button onClick={() => setOpen(true)} aria-label="Créer un événement de famille">
            <Plus size={18} aria-hidden="true" /> Ajouter un repas
          </Button>
        }
      />

      {loading ? (
        <Spinner label={COPY.loading.souvenirs} />
      ) : events.length === 0 ? (
        <EmptyState title="Pas encore de souvenirs" handText="Aucun repas noté pour l'instant. Noël approche — on commence par là ?">
          <Button size="lg" onClick={() => setOpen(true)}>
            <Plus size={20} aria-hidden="true" /> Noter notre premier repas
          </Button>
        </EmptyState>
      ) : (
        <ol className="relative space-y-8 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-terra/40">
          {years.map((year) => (
            <li key={year} className="relative pl-8">
              {/* Nœud de l'année sur le fil */}
              <span
                className="absolute left-0 top-1 w-4 h-4 rounded-full bg-terra border-2 border-creme shadow-card"
                aria-hidden="true"
              />
              <h3 className="font-serif text-2xl font-bold text-encre mb-3">{year}</h3>
              <ul className="space-y-4">
                {(byYear.get(year) ?? []).map((event) => {
                  const photo = familyPhotoUrl(event.photo_url)
                  return (
                    <li key={event.id}>
                      <Card className="bg-sauge/10 border-sauge/30">
                        <div className="flex flex-wrap items-start gap-4">
                          {photo && (
                            <img
                              src={photo}
                              alt={`Photo du repas ${event.title}`}
                              loading="lazy"
                              className="w-28 h-28 sm:w-36 sm:h-36 object-cover rounded-xl border-2 border-encre/10 shrink-0"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="kicker">{formatDate(event.event_date)}</p>
                            <p className="font-serif text-xl font-semibold leading-tight">{event.title}</p>
                            {event.note && (
                              <p className="text-encre-soft mt-1 whitespace-pre-line">{event.note}</p>
                            )}
                            {event.recipes && event.recipes.length > 0 && (
                              <ul className="flex flex-wrap gap-2 mt-2">
                                {event.recipes.map((recipe) => (
                                  <li key={recipe.id}>
                                    <Link
                                      to={`/recettes/${recipe.id}`}
                                      className="inline-block bg-creme border-2 border-encre/15 rounded-full px-3 py-1 text-sm font-bold text-encre hover:border-terra-dark hover:text-terra-dark"
                                    >
                                      {recipe.title}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => remove(event.id)}
                            aria-label={`Retirer le souvenir ${event.title}`}
                            className="touch-target-lg min-h-11 min-w-11 rounded-full text-encre-soft hover:text-carmine inline-flex items-center justify-center shrink-0"
                          >
                            <Trash2 size={18} aria-hidden="true" />
                          </button>
                        </div>
                      </Card>
                    </li>
                  )
                })}
              </ul>
            </li>
          ))}
        </ol>
      )}

      {open && (
        <AddEventModal
          recipes={recipes}
          onClose={() => setOpen(false)}
          onCreated={() => {
            setOpen(false)
          }}
          add={add}
        />
      )}
    </section>
  )
}

// ---------- Modal de création d'événement ----------

interface AddEventModalProps {
  recipes: { id: string; title: string }[]
  onClose: () => void
  onCreated: () => void
  add: ReturnType<typeof useFamilyEvents>['add']
}

function AddEventModal({ recipes, onClose, onCreated, add }: AddEventModalProps) {
  const [title, setTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [note, setNote] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [recipeIds, setRecipeIds] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  function toggleRecipe(recipeId: string) {
    setRecipeIds((prev) =>
      prev.includes(recipeId) ? prev.filter((id) => id !== recipeId) : [...prev, recipeId],
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSending(true)
    setError(null)
    const { error: addError } = await add({
      title,
      event_date: eventDate,
      note,
      photoFile,
      recipeIds,
    })
    setSending(false)
    if (addError) {
      setError(addError)
      return
    }
    onCreated()
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
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-event-title"
        className="card-surface w-full max-w-lg p-6 max-h-[90dvh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="add-event-title" className="text-2xl font-semibold">
            Noter un repas de famille
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Ranger"
            className="touch-target-lg min-h-11 min-w-11 rounded-full text-encre-soft hover:text-terra-dark inline-flex items-center justify-center"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <TextInput
            label="Le repas"
            htmlFor="event-title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Noël 2026"
          />
          <TextInput
            label="La date"
            htmlFor="event-date"
            type="date"
            required
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
          <TextArea
            label="Une note (facultative)"
            htmlFor="event-note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Chez mamie, il y avait toute la famille…"
          />

          {recipes.length > 0 && (
            <fieldset>
              <legend className="block font-bold text-encre mb-1.5">Le menu servi</legend>
              <div className="flex flex-wrap gap-2">
                {recipes.map((recipe) => {
                  const selected = recipeIds.includes(recipe.id)
                  return (
                    <button
                      key={recipe.id}
                      type="button"
                      onClick={() => toggleRecipe(recipe.id)}
                      aria-pressed={selected}
                      className={cn(
                        'min-h-11 px-4 rounded-full border-2 font-bold transition-colors',
                        selected
                          ? 'bg-terra-dark text-creme border-terra'
                          : 'bg-creme text-encre border-encre/20 hover:border-terra-dark hover:text-terra',
                      )}
                    >
                      {recipe.title}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          )}

          <div>
            <span className="block font-bold text-encre mb-1.5">Une photo du repas (facultative)</span>
            <label
              htmlFor="event-photo"
              className={cn(
                'cursor-pointer w-full min-h-11 inline-flex items-center justify-center gap-2 px-5 rounded-2xl border-2 font-bold transition-colors',
                photoFile
                  ? 'border-sauge bg-sauge/10 text-encre'
                  : 'border-encre/25 bg-creme hover:border-terra-dark hover:text-terra',
              )}
            >
              <ImagePlus size={20} aria-hidden="true" />
              {photoFile ? 'Changer la photo' : 'Choisir une photo'}
            </label>
            <input id="event-photo" type="file" accept="image/*" className="sr-only" onChange={handlePhoto} />
            {photoPreview && (
              <span className="relative inline-block mt-3">
                <img
                  src={photoPreview}
                  alt="Aperçu de la photo"
                  className="w-full max-h-56 object-cover rounded-xl border-2 border-encre/10"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFile(null)
                    setPhotoPreview(null)
                  }}
                  aria-label="Retirer la photo"
                  className="absolute top-2 right-2 touch-target-lg min-h-11 min-w-11 rounded-full bg-carmine text-creme flex items-center justify-center"
                >
                  <Trash2 size={18} aria-hidden="true" />
                </button>
              </span>
            )}
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
            <Button type="submit" disabled={sending || !title.trim() || !eventDate}>
              <Send size={18} aria-hidden="true" />
              {sending ? 'On grave le souvenir…' : 'Enfourner le souvenir'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
