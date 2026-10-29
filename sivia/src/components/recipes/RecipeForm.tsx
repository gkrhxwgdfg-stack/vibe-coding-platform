import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ImagePlus, Minus, Plus, Trash2 } from 'lucide-react'
import { CATEGORIES } from '@/lib/constants'
import type { Recipe, RecipeCategory, RecipeFormValues } from '@/lib/types'
import { photoPublicUrl } from '@/services/recipes'
import { Button } from '@/components/ui/Button'
import { TextInput, TextArea, Select } from '@/components/ui/FormFields'
import { cn } from '@/lib/utils'
import { COPY } from '@/lib/copy'

interface RecipeFormProps {
  initial?: Recipe | null
  submitting: boolean
  onSubmit: (values: RecipeFormValues) => Promise<{ error: string | null }>
}

function toFormValues(recipe?: Recipe | null): RecipeFormValues {
  return {
    title: recipe?.title ?? '',
    category: recipe?.category ?? 'plat',
    servings: recipe?.servings ?? 4,
    prep_time: recipe?.prep_time != null ? String(recipe.prep_time) : '',
    cook_time: recipe?.cook_time != null ? String(recipe.cook_time) : '',
    ingredients: recipe?.ingredients.length ? recipe.ingredients : [''],
    steps: recipe?.steps.length ? recipe.steps : [''],
    anecdote: recipe?.anecdote ?? '',
    origin_story: recipe?.origin_story ?? '',
    photoFile: null,
  }
}

/** Formulaire de recette : création et édition (mêmes champs) */
export function RecipeForm({ initial, submitting, onSubmit }: RecipeFormProps) {
  const navigate = useNavigate()
  const [values, setValues] = useState<RecipeFormValues>(() => toFormValues(initial))
  const [error, setError] = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(initial?.photo_url ? photoPublicUrl(initial.photo_url) : null)
  const [removePhoto, setRemovePhoto] = useState(false)

  // Réinitialise si on passe de création à édition (changement de recette)
  useEffect(() => {
    setValues(toFormValues(initial))
    setPhotoPreview(initial?.photo_url ? photoPublicUrl(initial.photo_url) : null)
    setRemovePhoto(false)
  }, [initial?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  function update<K extends keyof RecipeFormValues>(key: K, value: RecipeFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  function updateList(key: 'ingredients' | 'steps', index: number, value: string) {
    setValues((v) => ({
      ...v,
      [key]: v[key].map((item, i) => (i === index ? value : item)),
    }))
  }

  function addListItem(key: 'ingredients' | 'steps') {
    setValues((v) => ({ ...v, [key]: [...v[key], ''] }))
  }

  function removeListItem(key: 'ingredients' | 'steps', index: number) {
    setValues((v) => ({ ...v, [key]: v[key].filter((_, i) => i !== index) }))
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    update('photoFile', file)
    setRemovePhoto(false)
    if (file) {
      const reader = new FileReader()
      reader.onload = () => setPhotoPreview(reader.result as string)
      reader.readAsDataURL(file)
    } else if (!initial?.photo_url) {
      setPhotoPreview(null)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!values.title.trim()) {
      setError('Ta recette a besoin d’un titre — même « la soupe de maman » fera l’affaire.')
      return
    }
    if (values.ingredients.every((i) => i.trim() === '') || values.steps.every((s) => s.trim() === '')) {
      setError('Il manque un bout de l’histoire : ajoute au moins un ingrédient et une étape.')
      return
    }
    const { error: submitError } = await onSubmit({
      ...values,
      keepExistingPhoto: !removePhoto,
    } as RecipeFormValues & { keepExistingPhoto: boolean })
    if (submitError) setError(submitError)
  }

  const inputClasses =
    'w-full min-h-11 rounded-xl border-2 border-encre/20 bg-creme px-4 py-2.5 focus:border-terra focus:outline-none'

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <TextInput
        label="Le titre de la recette"
        htmlFor="title"
        required
        value={values.title}
        onChange={(e) => update('title', e.target.value)}
        placeholder="Blanquette de veau, comme chez Tata Suzanne"
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Catégorie"
          htmlFor="category"
          value={values.category}
          onChange={(e) => update('category', e.target.value as RecipeCategory)}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
        <div>
          <label htmlFor="servings" className="block font-bold text-encre mb-1.5">
            Portions de base
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => update('servings', Math.max(1, values.servings - 1))}
              aria-label="Une portion de moins"
              className="touch-target-lg min-h-11 min-w-11 rounded-full border-2 border-encre/20 bg-creme hover:border-terra-dark hover:text-terra-dark inline-flex items-center justify-center"
            >
              <Minus size={18} aria-hidden="true" />
            </button>
            <span className="text-2xl font-serif font-bold w-10 text-center" aria-live="polite">
              {values.servings}
            </span>
            <button
              type="button"
              onClick={() => update('servings', values.servings + 1)}
              aria-label="Une portion de plus"
              className="touch-target-lg min-h-11 min-w-11 rounded-full border-2 border-encre/20 bg-creme hover:border-terra-dark hover:text-terra-dark inline-flex items-center justify-center"
            >
              <Plus size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TextInput
          label="Préparation (min)"
          htmlFor="prep_time"
          type="number"
          min={0}
          inputMode="numeric"
          value={values.prep_time}
          onChange={(e) => update('prep_time', e.target.value)}
          placeholder="30"
        />
        <TextInput
          label="Cuisson (min)"
          htmlFor="cook_time"
          type="number"
          min={0}
          inputMode="numeric"
          value={values.cook_time}
          onChange={(e) => update('cook_time', e.target.value)}
          placeholder="90"
        />
      </div>

      {/* Photo */}
      <div>
        <span className="block font-bold text-encre mb-1.5">La photo du plat</span>
        <div className="flex flex-wrap items-center gap-4">
          <label
            htmlFor="photo"
            className={cn(
              'cursor-pointer inline-flex items-center gap-2 min-h-11 px-5 rounded-2xl border-2 font-bold transition-colors',
              'border-encre/25 bg-creme hover:border-terra-dark hover:text-terra',
            )}
          >
            <ImagePlus size={20} aria-hidden="true" />
            {photoPreview ? 'Changer la photo' : 'Ajouter une photo'}
          </label>
          <input id="photo" type="file" accept="image/*" className="sr-only" onChange={handlePhoto} />
          {photoPreview && !removePhoto && (
            <span className="relative inline-block">
              <img
                src={photoPreview}
                alt="Aperçu de la photo"
                className="w-24 h-24 object-cover rounded-xl border-2 border-encre/10"
              />
              <button
                type="button"
                onClick={() => {
                  setRemovePhoto(true)
                  update('photoFile', null)
                  setPhotoPreview(null)
                }}
                aria-label="Retirer la photo"
                className="absolute -top-2 -right-2 touch-target-lg min-h-11 min-w-11 rounded-full bg-carmine text-creme flex items-center justify-center"
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </span>
          )}
        </div>
      </div>

      {/* Ingrédients */}
      <fieldset>
        <legend className="block font-bold text-encre mb-1.5">
          Ce qu’il faut <span className="text-encre-soft font-normal">(et ce qu’on oublie jamais)</span>
        </legend>
        <div className="space-y-2">
          {values.ingredients.map((line, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={line}
                onChange={(e) => updateList('ingredients', i, e.target.value)}
                placeholder={i === 0 ? '200 g de farine' : 'une pincée de…'}
                aria-label={`Ingrédient ${i + 1}`}
                className={inputClasses}
              />
              <button
                type="button"
                onClick={() => removeListItem('ingredients', i)}
                aria-label={`Retirer l’ingrédient ${i + 1}`}
                className="touch-target-lg min-h-11 min-w-11 shrink-0 rounded-xl text-encre-soft hover:text-carmine inline-flex items-center justify-center"
              >
                <Trash2 size={18} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
        <Button type="button" variant="ghost" className="mt-2" onClick={() => addListItem('ingredients')}>
          <Plus size={18} aria-hidden="true" /> Ajouter un ingrédient
        </Button>
      </fieldset>

      {/* Étapes */}
      <fieldset>
        <legend className="block font-bold text-encre mb-1.5">Les étapes, dans l’ordre</legend>
        <div className="space-y-2">
          {values.steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <span
                className="touch-target-lg min-h-11 min-w-11 mt-1 rounded-full bg-terra-dark text-creme font-serif font-bold flex items-center justify-center shrink-0"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <textarea
                value={step}
                onChange={(e) => updateList('steps', i, e.target.value)}
                placeholder="Blanchir la viande 10 min, écumer soigneusement…"
                aria-label={`Étape ${i + 1}`}
                rows={2}
                className={inputClasses}
              />
              <button
                type="button"
                onClick={() => removeListItem('steps', i)}
                aria-label={`Retirer l’étape ${i + 1}`}
                className="touch-target-lg min-h-11 min-w-11 shrink-0 rounded-xl text-encre-soft hover:text-carmine inline-flex items-center justify-center"
              >
                <Trash2 size={18} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
        <Button type="button" variant="ghost" className="mt-2" onClick={() => addListItem('steps')}>
          <Plus size={18} aria-hidden="true" /> Ajouter une étape
        </Button>
      </fieldset>

      <TextArea
        label="Le secret — celui qu’on ne dit qu’à la famille"
        htmlFor="anecdote"
        rows={3}
        value={values.anecdote}
        onChange={(e) => update('anecdote', e.target.value)}
        placeholder="La crème, toujours hors du feu — tata y tenait."
      />

      <TextArea
        label="Qui t’a appris ce plat ?"
        htmlFor="origin_story"
        rows={2}
        value={values.origin_story}
        onChange={(e) => update('origin_story', e.target.value)}
        placeholder="Transmise par Tata Suzanne, dictée à Papa, notée par Léa un dimanche de pluie…"
        hint="L’origine du plat : c’est l’authenticité, le tampon de ta recette."
      />

      {error && (
        <p className="text-carmine font-bold" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 pt-2">
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting
            ? COPY.loading.ecriture
            : initial
              ? 'Enfourner les changements'
              : COPY.actions.partager}
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={() => navigate(-1)}>
          Annuler
        </Button>
      </div>
    </form>
  )
}
