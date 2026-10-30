import { useEffect } from 'react'
import { BookOpen, Download, Lock, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PRIX, eur } from '@/lib/monetisation'
import type { RecipeWithMeta } from '@/lib/types'

interface ApercuLivreModalProps {
  open: boolean
  onClose: () => void
  familyName: string
  /** Recettes de la famille (déjà chargées par la page) */
  recipes: RecipeWithMeta[]
  /** Le groupe a-t-il le plan actif (essai ou abonné) ? */
  premium: boolean
  /** Ouvre le paywall (groupe non abonné) */
  onSubscribe: () => void
  /** Télécharge le vrai carnet (sans filigrane) */
  onDownload: () => void
}

/** Filigrane « Aperçu » en diagonale — rend le document inutilisable mais invitant. */
function Filigrane() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 z-10 grid grid-cols-3 gap-x-4 gap-y-10 overflow-hidden py-6 pointer-events-none select-none"
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <span
          key={i}
          className="-rotate-[24deg] justify-self-center whitespace-nowrap font-serif italic text-lg text-ble/20"
        >
          Aperçu
        </span>
      ))}
    </div>
  )
}

/**
 * Aperçu gratuit du livre de famille — toujours accessible, sans compte ni carte.
 * Les 2 premières recettes se lisent pour de vrai (avec filigrane) ; la suite
 * est floutée avec un cadenas : on montre la valeur, on ne la donne pas.
 */
export function ApercuLivreModal({
  open,
  onClose,
  familyName,
  recipes,
  premium,
  onSubscribe,
  onDownload,
}: ApercuLivreModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const apercu = recipes.slice(0, 2)
  const restantes = Math.max(recipes.length - apercu.length, 0)

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
        aria-labelledby="apercu-title"
        className="bg-carte w-full max-w-md rounded-[20px] max-h-[90dvh] overflow-y-auto shadow-soft"
      >
        {/* En-tête */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 sm:px-6">
          <div>
            <p className="kicker text-vert">Aperçu gratuit</p>
            <h2 id="apercu-title" className="font-serif text-2xl text-encre">
              Le carnet de {familyName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Ranger"
            className="min-h-11 min-w-11 rounded-full text-encre-doux hover:text-tomate inline-flex items-center justify-center transition-colors"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {recipes.length === 0 ? (
          <div className="px-5 pb-6 sm:px-6 text-encre-doux text-sm leading-relaxed">
            Ajoutez quelques recettes, et l’aperçu du livre se remplira tout seul.
          </div>
        ) : (
          <>
            <div className="px-5 pb-6 sm:px-6 space-y-4">
              {/* Couverture du carnet */}
              <div className="relative rounded-2xl border-2 border-encre-doux/15 bg-papier p-6 text-center overflow-hidden">
                <Filigrane />
                <p className="kicker text-vert mb-2">Recettes, anecdotes & transmissions</p>
                <p className="font-serif text-3xl text-encre leading-tight">
                  Le carnet
                  <br />
                  de {familyName}
                </p>
                <div className="filet-double mt-4" />
                <p className="text-encre-doux text-sm mt-3 font-serif italic">
                  « Ce que la famille mange, la famille le garde. »
                </p>
              </div>

              {/* Pages lisibles : 2 recettes réelles, filigranées */}
              {apercu.map((recipe) => (
                <div
                  key={recipe.id}
                  className="relative rounded-2xl border-2 border-encre-doux/15 bg-white p-5 overflow-hidden"
                >
                  <Filigrane />
                  <p className="kicker text-tomate mb-1">{recipe.category}</p>
                  <h3 className="font-serif text-xl text-encre leading-snug">{recipe.title}</h3>
                  <p className="text-encre-doux text-sm mt-0.5">
                    par {recipe.author?.display_name ?? 'quelqu’un de la famille'}
                  </p>
                  <p className="text-encre-doux text-sm mt-3 leading-relaxed">
                    {recipe.ingredients.slice(0, 4).join(' · ')}
                  </p>
                  {recipe.anecdote && (
                    <p className="marge-note text-encre-doux text-sm italic mt-3">
                      {recipe.anecdote}
                    </p>
                  )}
                </div>
              ))}

              {/* Suite floutée : la valeur se montre, ne se donne pas */}
              {restantes > 0 && (
                <div className="relative rounded-2xl border-2 border-encre-doux/15 bg-vert-clair/40 p-5 text-center">
                  <div className="flex flex-col items-center gap-2 blur-[3px] select-none" aria-hidden="true">
                    <p className="font-serif text-lg text-encre">Bûche de Noël d’arrière-grand-mère</p>
                    <p className="text-sm text-encre-doux">farine · beurre · sucre glace · œuvre de dix doigts</p>
                    <p className="font-serif text-lg text-encre mt-2">La blanquette du dimanche</p>
                    <p className="text-sm text-encre-doux">veau · carottes · thym · trois heures de four</p>
                  </div>
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1.5 px-5 pointer-events-none">
                    <Lock size={22} className="text-encre" aria-hidden="true" />
                    <p className="font-extrabold text-encre text-center leading-snug">
                      {restantes} recette{restantes > 1 ? 's' : ''} vous attendent dans le livre complet
                    </p>
                  </div>
                </div>
              )}

              {/* Appel à l'action */}
              {premium ? (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    onClose()
                    onDownload()
                  }}
                >
                  <Download size={18} aria-hidden="true" />
                  Télécharger le carnet (sans filigrane)
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => {
                      onClose()
                      onSubscribe()
                    }}
                  >
                    <BookOpen size={18} aria-hidden="true" />
                    Débloquer le livre complet
                  </Button>
                  <p className="text-center text-encre-doux text-sm leading-relaxed">
                    Sivia Famille — {eur(PRIX.mensuel)} par mois ou {eur(PRIX.annuel)} par an, pour
                    toute la famille
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
