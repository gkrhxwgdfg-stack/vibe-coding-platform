import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Check, ChevronLeft, ChevronRight, ImagePlus, Plus, X } from 'lucide-react'
import { useRecipe } from '@/hooks/useRecipes'
import { useAuth } from '@/context/AuthContext'
import { cookingStep } from '@/lib/cooking'
import { scaleIngredients } from '@/lib/scale'
import { formatDate } from '@/lib/format'
import {
  clearCookingSession,
  createTimer,
  loadCookingSession,
  saveCookingSession,
  type TimerState,
} from '@/lib/cookingSession'
import { addComment } from '@/services/comments'
import { photoPublicUrl } from '@/services/recipes'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { CookingTimerV2 } from '@/components/recipes/CookingTimerV2'
import { ConfettiPaper } from '@/components/recipes/ConfettiPaper'
import { Polaroid } from '@/components/ui/Polaroid'
import { COPY } from '@/lib/copy'
import { cn } from '@/lib/utils'

type Phase = 'mise-en-place' | 'cooking' | 'done'

/**
 * Mode cuisson v2 : plein écran, une étape à la fois, façon diaporama.
 * - Écran « La mise en place » avant le plein écran (checklist + portions)
 * - Transition d'entrée : fiche repliée (scale 0.96 + fondu 400 ms)
 * - Étapes 1.9 rem, barre de progression pleine « 3/8 », flèches 64 px, swipe, clavier
 * - Ingrédients de l'étape surlignés moutarde-soft, déjà-utilisés atténués
 * - Minuteurs libellés, cercle couture, pré-alerte, fin carmine + vibration
 * - Écran final « C'est prêt ! » : polaroïd + confettis papier 1.8 s (une fois)
 * - Persistance localStorage (étape + minuteurs), reprise après verrouillage
 */
export function CookingPage() {
  const { id } = useParams<{ id: string }>()
  const { recipe, loading, error } = useRecipe(id)
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [phase, setPhase] = useState<Phase>('mise-en-place')
  const [index, setIndex] = useState(0)
  const [servings, setServings] = useState<number | null>(null)
  const [checked, setChecked] = useState<ReadonlySet<number>>(new Set())
  const [timers, setTimers] = useState<TimerState[]>([])
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const touchStartX = useRef<number | null>(null)

  // Reprise de session persistée (étape + minuteurs)
  const restoredRef = useRef(false)
  useEffect(() => {
    if (!recipe || restoredRef.current) return
    restoredRef.current = true
    const saved = loadCookingSession(recipe.id)
    if (saved && saved.stepIndex < recipe.steps.length) {
      setIndex(saved.stepIndex)
      setTimers(saved.timers)
      setPhase('cooking')
    }
  }, [recipe])

  // Persistance à chaque changement (étape + minuteurs)
  useEffect(() => {
    if (!recipe || phase !== 'cooking') return
    saveCookingSession({ recipeId: recipe.id, stepIndex: index, timers, updatedAt: Date.now() })
  }, [recipe, phase, index, timers])

  // Wake Lock : l'écran reste allumé pendant la cuisson (si l'API est dispo)
  useEffect(() => {
    if (phase !== 'cooking') return
    let sentinel: { release: () => void } | null = null
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: string) => Promise<{ release: () => void }> }
    }
    nav.wakeLock
      ?.request('screen')
      .then((s) => {
        sentinel = s
      })
      .catch(() => {
        /* pas grave : l'écran pourra s'éteindre */
      })
    return () => sentinel?.release()
  }, [phase])

  const effectiveServings = servings ?? recipe?.servings ?? 4

  const stepData = useMemo(() => {
    if (!recipe || recipe.steps.length === 0) return null
    const clamped = Math.min(index, recipe.steps.length - 1)
    return cookingStep(recipe, clamped)
  }, [recipe, index])

  const scaledIngredients = useMemo(() => {
    if (!recipe) return []
    return scaleIngredients(recipe.ingredients, recipe.servings, effectiveServings)
  }, [recipe, effectiveServings])

  function goNext() {
    if (!recipe) return
    if (index >= recipe.steps.length - 1) {
      setPhase('done')
      clearCookingSession(recipe.id)
      return
    }
    setIndex((value) => Math.min(value + 1, recipe.steps.length - 1))
  }
  function goPrev() {
    setIndex((value) => Math.max(value - 1, 0))
  }

  // Navigation clavier : flèches gauche / droite
  useEffect(() => {
    if (phase !== 'cooking') return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'ArrowRight') goNext()
      if (event.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Navigation tactile : swipe gauche / droite
  function onTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.touches[0].clientX
  }
  function onTouchEnd(event: React.TouchEvent) {
    if (touchStartX.current === null) return
    const delta = event.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(delta) < 60) return
    if (delta < 0) goNext()
    else goPrev()
  }

  function updateTimer(next: TimerState) {
    setTimers((prev) => prev.map((t) => (t.id === next.id ? next : t)))
  }

  function addTimerFromStep() {
    if (!recipe || !stepData || stepData.minutes == null) return
    const label = `Étape ${index + 1}`
    setTimers((prev) => [...prev, createTimer(label, stepData.minutes!)])
  }

  async function publishCooked() {
    if (!recipe || !profile?.family_id || !profile.id) return
    setPublishing(true)
    const body = `Cuisinée par ${profile.display_name} le ${formatDate(new Date().toISOString())}`
    // Le message est écrit dans le fil de vie, avec la photo du plat si jointe
    await addComment(recipe.id, profile.family_id, profile.id, body, photoFile)
    setPublishing(false)
  }

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

  function quit() {
    if (recipe) clearCookingSession(recipe.id)
    navigate('/recettes/' + (id ?? ''), { replace: true })
  }

  if (loading) return <Spinner label={COPY.loading.cuisson} />
  if (error || !recipe || !stepData) {
    return (
      <EmptyState title="Pas de cuisson possible" handText={COPY.empty.etapes}>
        <Link to={'/recettes/' + id}>
          <Button variant="outline">Retour à la recette</Button>
        </Link>
      </EmptyState>
    )
  }

  const lastStep = index === recipe.steps.length - 1
  const photo = photoPublicUrl(recipe.photo_url)

  // ---------- Écran « La mise en place » ----------
  if (phase === 'mise-en-place') {
    return (
      <div className="min-h-[100dvh] bg-papier flex flex-col anim-fold-in">
        <header className="flex items-center gap-3 p-4 pt-6 max-w-3xl w-full mx-auto">
          <button
            type="button"
            onClick={quit}
            aria-label="Ranger le mode cuisson"
            className="touch-target-lg min-h-12 min-w-12 rounded-full bg-carte border-2 border-encre/10 inline-flex items-center justify-center hover:border-vert hover:text-vert"
          >
            <X size={22} aria-hidden="true" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="kicker">La mise en place</p>
            <h1 className="font-serif text-xl font-bold truncate">{recipe.title}</h1>
          </div>
        </header>

        <main className="flex-1 w-full max-w-xl mx-auto px-4 py-6 space-y-6">
          {/* Portions */}
          <Card>
            <p className="kicker mb-2">Pour combien ?</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setServings(Math.max(1, effectiveServings - 1))}
                aria-label="Une part de moins"
                className="touch-target-lg min-h-12 min-w-12 rounded-full border-2 border-encre/20 bg-carte hover:border-vert hover:text-vert inline-flex items-center justify-center"
              >
                <ChevronLeft size={20} aria-hidden="true" />
              </button>
              <span className="text-2xl font-serif font-bold" aria-live="polite">
                {effectiveServings} part{effectiveServings > 1 ? 's' : ''}
              </span>
              <button
                type="button"
                onClick={() => setServings(effectiveServings + 1)}
                aria-label="Une part de plus"
                className="touch-target-lg min-h-12 min-w-12 rounded-full border-2 border-encre/20 bg-carte hover:border-vert hover:text-vert inline-flex items-center justify-center"
              >
                <Plus size={20} aria-hidden="true" />
              </button>
            </div>
          </Card>

          {/* Checklist des ingrédients */}
          <Card>
            <p className="kicker mb-2">Ce qu'il faut sortir du placard</p>
            <ul className="space-y-1">
              {scaledIngredients.map((line, i) => {
                const isChecked = checked.has(i)
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() =>
                        setChecked((prev) => {
                          const next = new Set(prev)
                          if (next.has(i)) next.delete(i)
                          else next.add(i)
                          return next
                        })
                      }
                      aria-pressed={isChecked}
                      className="flex items-start gap-3 w-full text-left min-h-11 py-1 rounded-lg"
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'mt-1.5 w-6 h-6 rounded-md border-2 shrink-0 inline-flex items-center justify-center transition-colors',
                          isChecked ? 'bg-tomate border-tomate text-white' : 'border-encre/30 bg-carte',
                        )}
                      >
                        {isChecked && <Check size={16} strokeWidth={3} aria-hidden="true" />}
                      </span>
                      <span className={cn('text-lg', isChecked ? 'text-encre-doux line-through' : 'text-encre')}>
                        {line}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </Card>
        </main>

        <footer className="sticky bottom-0 p-4 pb-6 bg-gradient-to-t from-papier via-papier">
          <div className="max-w-xl mx-auto">
            <Button size="lg" className="w-full" onClick={() => setPhase('cooking')}>
              On commence
            </Button>
          </div>
        </footer>
      </div>
    )
  }

  // ---------- Écran final « C'est prêt ! » ----------
  if (phase === 'done') {
    return (
      <div className="relative min-h-[100dvh] bg-papier flex flex-col items-center justify-center px-4 py-10 overflow-hidden anim-fold-in">
        <ConfettiPaper />
        <div className="relative z-10 flex flex-col items-center gap-6 text-center max-w-md">
          <h1 className="font-serif text-4xl font-bold text-tomate">C'est prêt !</h1>
          {photo && (
            <Polaroid
              src={photo}
              caption={`${recipe.title} — cuisinée aujourd'hui`}
              tilt={-2.5}
              className="w-[220px]"
            />
          )}
          <p className="font-serif italic text-encre-doux text-2xl">Bonne dégustation, la famille !</p>

          {/* Ajouter une photo du plat */}
          <div className="w-full">
            <label
              htmlFor="cooked-photo"
              className="cursor-pointer w-full min-h-12 inline-flex items-center justify-center gap-2 px-5 rounded-2xl border-2 border-encre/25 bg-carte font-bold hover:border-vert hover:text-vert transition-colors"
            >
              <ImagePlus size={20} aria-hidden="true" />
              {photoFile ? 'Changer la photo' : 'Ajouter une photo du plat'}
            </label>
            <input id="cooked-photo" type="file" accept="image/*" className="sr-only" onChange={handlePhoto} />
            {photoPreview && (
              <span className="relative inline-block mt-3">
                <img
                  src={photoPreview}
                  alt="Aperçu de la photo du plat"
                  className="w-24 h-24 object-cover rounded-xl border-2 border-encre/10"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFile(null)
                    setPhotoPreview(null)
                  }}
                  aria-label="Retirer la photo"
                  className="absolute -top-2 -right-2 touch-target-lg min-h-11 min-w-11 rounded-full bg-tomate text-white flex items-center justify-center"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3 w-full">
            <Button
              size="lg"
              onClick={async () => {
                await publishCooked()
                navigate('/recettes/' + recipe.id, { replace: true })
              }}
              disabled={publishing}
            >
              {publishing ? 'On écrit dans le fil de vie...' : 'Partager à la famille'}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/recettes/' + recipe.id, { replace: true })}
            >
              Retour au carnet
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ---------- Cuisson : une étape à la fois ----------
  const usedIngredients = new Set(
    recipe.steps.slice(0, index).flatMap((_, i) =>
      cookingStep(recipe, i).ingredients.filter((ing) => ing.active).map((ing) => ing.line),
    ),
  )

  return (
    <div
      className="min-h-[100dvh] bg-papier flex flex-col anim-fold-in"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Barre du haut : quitter, titre, progression couture « 3/8 » */}
      <header className="flex items-center gap-3 p-4 pt-6 max-w-3xl w-full mx-auto">
        <button
          type="button"
          onClick={quit}
          aria-label="Ranger le mode cuisson"
          className="touch-target-lg min-h-12 min-w-12 rounded-full bg-carte border-2 border-encre/10 inline-flex items-center justify-center hover:border-vert hover:text-vert"
        >
          <X size={22} aria-hidden="true" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="kicker">En cuisine</p>
          <h1 className="font-serif text-xl font-bold truncate">{recipe.title}</h1>
        </div>
        <span className="font-bold text-encre-doux" aria-live="polite">
          {index + 1}/{recipe.steps.length}
        </span>
      </header>

      {/* Barre de progression pleine (sans texte au-dessus, sans pointillés) */}
      <div
        className="max-w-3xl w-full mx-auto px-4 mt-3"
        role="progressbar"
        aria-label={`Étape ${index + 1} sur ${recipe.steps.length}`}
        aria-valuenow={index + 1}
        aria-valuemin={1}
        aria-valuemax={recipe.steps.length}
      >
        <div className="h-2 rounded-full bg-encre/10 flex gap-1 overflow-hidden">
          {recipe.steps.map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-full flex-1 rounded-full transition-colors',
                i <= index ? 'bg-tomate' : 'bg-encre/10',
              )}
            />
          ))}
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-6 text-center max-w-3xl w-full mx-auto">
        {/* Numéro d'étape */}
        <span
          className="w-14 h-14 rounded-full bg-tomate text-white font-serif font-bold text-2xl flex items-center justify-center"
          aria-hidden="true"
        >
          {index + 1}
        </span>
        {/* Étape : 1.9 rem (2.3 rem si .reading-lg — chantier 8) */}
        <p className="cooking-step text-[1.9rem] leading-relaxed font-medium text-encre max-w-xl">
          {stepData.step}
        </p>

        {/* Minuteurs libellés de l'étape */}
        {stepData.minutes != null && (
          <div className="w-full max-w-sm space-y-3">
            {timers.map((timer) => (
              <CookingTimerV2 key={timer.id} timer={timer} onChange={updateTimer} />
            ))}
            {timers.length === 0 && (
              <Button variant="outline" onClick={addTimerFromStep}>
                <Plus size={18} aria-hidden="true" /> Minuteur {stepData.minutes} min
              </Button>
            )}
          </div>
        )}

        {/* Ingrédients : ceux de l'étape surlignés moutarde-soft, déjà-utilisés atténués */}
        {stepData.ingredients.length > 0 && (
          <section className="w-full max-w-md" aria-label="Ingrédients de l'étape">
            <p className="kicker mb-2">Ce qu'il faut pour cette étape</p>
            <ul className="space-y-1.5 text-left">
              {stepData.ingredients.map((ingredient, i) => (
                <li
                  key={i}
                  className={cn(
                    'flex items-start gap-3 rounded-xl px-3 py-2 transition-colors',
                    ingredient.active
                      ? 'bg-ble-clair font-bold text-encre'
                      : usedIngredients.has(ingredient.line)
                        ? 'text-encre-doux/60'
                        : 'text-encre-doux',
                  )}
                >
                  <span
                    className={cn(
                      'mt-2 w-2 h-2 rounded-full shrink-0',
                      ingredient.active ? 'bg-tomate' : 'bg-encre/20',
                    )}
                    aria-hidden="true"
                  />
                  <span>{ingredient.line}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      {/* Navigation : précédent / suivant, flèches 64 px */}
      <footer className="sticky bottom-0 p-4 pb-6 bg-gradient-to-t from-papier via-papier">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={goPrev}
            disabled={index === 0}
            aria-label="Étape précédente"
            className="touch-target-lg min-h-16 min-w-16 rounded-full bg-carte border-2 border-encre/10 inline-flex items-center justify-center hover:border-vert hover:text-vert disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={28} aria-hidden="true" />
          </button>

          {lastStep ? (
            <Button variant="primary" size="lg" onClick={goNext}>
              C'est prêt ! <Check size={20} aria-hidden="true" />
            </Button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              aria-label="Étape suivante"
              className="touch-target-lg min-h-16 min-w-16 rounded-full bg-tomate text-white inline-flex items-center justify-center shadow-soft hover:bg-[#a72f23]"
            >
              <ChevronRight size={28} aria-hidden="true" />
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}
