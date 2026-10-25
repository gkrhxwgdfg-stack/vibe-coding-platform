import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useRecipe } from '@/hooks/useRecipes'
import { cookingStep } from '@/lib/cooking'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { CookingTimer } from '@/components/recipes/CookingTimer'
import { cn } from '@/lib/utils'
import { COPY } from '@/lib/copy'

/**
 * Mode cuisson : plein écran, une étape à la fois, façon diaporama.
 * - swipe (mobile) et flèches clavier pour naviguer entre les étapes
 * - minuteur adapté de l'horloge de la DA (contour pointillé terracotta, sans son)
 * - ingrédients de l'étape surlignés
 * - l'écran reste allumé pendant la cuisson (Wake Lock, si disponible)
 */
export function CookingPage() {
  const { id } = useParams<{ id: string }>()
  const { recipe, loading, error } = useRecipe(id)
  const navigate = useNavigate()

  const [index, setIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)

  // Empêcher l'écran de s'éteindre pendant la cuisson (si l'API est dispo)
  useEffect(() => {
    let sentinel: { release: () => void } | null = null
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: string) => Promise<{ release: () => void }> }
    }
    nav.wakeLock
      ?.request('screen')
      .then((s) => { sentinel = s })
      .catch(() => { /* pas grave : l'écran pourra s'éteindre */ })
    return () => sentinel?.release()
  }, [])

  const stepData = useMemo(() => {
    if (!recipe || recipe.steps.length === 0) return null
    return cookingStep(recipe, index)
  }, [recipe, index])

  function goNext() {
    setIndex((value) => Math.min(value + 1, (recipe?.steps.length ?? 1) - 1))
  }
  function goPrev() {
    setIndex((value) => Math.max(value - 1, 0))
  }

  // Navigation clavier : flèches gauche / droite (à chaque rendu pour
  // toujours fermer sur les dernières closures de navigation)
  useEffect(() => {
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
    if (Math.abs(delta) < 60) return // trop court : ce n'était pas un swipe
    if (delta < 0) goNext()
    else goPrev()
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

  return (
    <div
      className="min-h-[100dvh] bg-lin flex flex-col"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Barre du haut : quitter, titre, progression */}
      <header className="flex items-center gap-3 p-4 pt-6 max-w-3xl w-full mx-auto">
        <button
          type="button"
          onClick={() => navigate('/recettes/' + recipe.id)}
          aria-label="Quitter le mode cuisson"
          className="min-h-11 min-w-11 rounded-full bg-creme border-2 border-encre/10 inline-flex items-center justify-center hover:border-terra hover:text-terra"
        >
          <X size={22} aria-hidden="true" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="kicker">En cuisine</p>
          <h1 className="font-serif text-xl font-bold truncate">{recipe.title}</h1>
        </div>
        <span className="font-bold text-encre-soft" aria-live="polite">
          Étape {index + 1}/{recipe.steps.length}
        </span>
      </header>

      {/* Étape en cours + minuteur */}
      <main className="flex-1 flex flex-col items-center justify-center gap-8 px-5 pb-6 max-w-3xl w-full mx-auto text-center">
        <span
          className="w-14 h-14 rounded-full bg-terra text-creme font-serif text-2xl font-bold flex items-center justify-center"
          aria-hidden="true"
        >
          {index + 1}
        </span>
        <p className="text-2xl sm:text-3xl leading-relaxed font-medium text-encre max-w-xl">
          {stepData.step}
        </p>

        {/* Minuteur quand l'étape contient une durée (« 20 min », « 1 h »…) */}
        {stepData.minutes != null && (
          <CookingTimer key={index} initialMinutes={stepData.minutes} />
        )}

        {/* Ingrédients : ceux de l'étape sont surlignés */}
        {stepData.ingredients.length > 0 && (
          <section className="w-full max-w-md" aria-label="Ingrédients de l'étape">
            <p className="kicker mb-2">Ce qu’il faut pour cette étape</p>
            <ul className="space-y-1.5 text-left">
              {stepData.ingredients.map((ingredient, i) => (
                <li
                  key={i}
                  className={cn(
                    'flex items-start gap-3 rounded-xl px-3 py-2 transition-colors',
                    ingredient.active ? 'bg-moutarde/25 font-bold text-encre' : 'text-encre-soft'
                  )}
                >
                  <span
                    className={cn(
                      'mt-2 w-2 h-2 rounded-full shrink-0',
                      ingredient.active ? 'bg-terra' : 'bg-encre/20'
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

      {/* Navigation : précédent / suivant, grosses cibles */}
      <footer className="sticky bottom-0 p-4 pb-6 bg-gradient-to-t from-lin via-lin">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={index === 0}
            aria-label="Étape précédente"
          >
            <ChevronLeft size={20} aria-hidden="true" /> Précédent
          </Button>

          {/* Points de progression */}
          <div className="flex gap-1.5 justify-center flex-1" aria-hidden="true">
            {recipe.steps.map((_, i) => (
              <span
                key={i}
                className={cn(
                  'w-2 h-2 rounded-full',
                  i === index ? 'bg-terra scale-125' : i < index ? 'bg-terra/50' : 'bg-encre/15'
                )}
              />
            ))}
          </div>

          {lastStep ? (
            <Button variant="primary" onClick={() => navigate('/recettes/' + recipe.id)}>
              C’est prêt ! <ChevronRight size={20} aria-hidden="true" />
            </Button>
          ) : (
            <Button variant="primary" onClick={goNext} aria-label="Étape suivante">
              Suivant <ChevronRight size={20} aria-hidden="true" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  )
}
