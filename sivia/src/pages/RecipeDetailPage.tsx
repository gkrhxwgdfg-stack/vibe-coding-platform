import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Clock,
  Heart,
  Lock,
  Minus,
  Pencil,
  Plus,
  Trash2,
  Users,
} from 'lucide-react'
import { useRecipe, useToggleFavorite } from '@/hooks/useRecipes'
import { useAuth } from '@/context/AuthContext'
import { deleteRecipe, photoPublicUrl, sealRecipe } from '@/services/recipes'
import { categoryMeta } from '@/lib/constants'
import { formatDate, formatDuration, formatRelative } from '@/lib/format'
import { scaleIngredients } from '@/lib/scale'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { Stamp } from '@/components/ui/Stamp'
import { cn } from '@/lib/utils'

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { recipe, loading, error, setRecipe } = useRecipe(id)
  const { user } = useAuth()
  const toggleFavorite = useToggleFavorite()
  const navigate = useNavigate()

  const [servings, setServings] = useState<number | null>(null)
  const [favBusy, setFavBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const effectiveServings = servings ?? recipe?.servings ?? 4

  const ingredients = useMemo(() => {
    if (!recipe) return []
    return scaleIngredients(recipe.ingredients, recipe.servings, effectiveServings)
  }, [recipe, effectiveServings])

  if (loading) return <Spinner label="On ouvre le carnet…" />
  if (error || !recipe) {
    return (
      <EmptyState handText="Il manque un bout de l’histoire. Tu l’ajouteras plus tard — elle attendra.">
        <Link to="/recettes">
          <Button variant="outline">Retour au carnet</Button>
        </Link>
      </EmptyState>
    )
  }

  // À partir d'ici, recipe est défini (garde ci-dessus)
  const current = recipe
  const meta = categoryMeta(current.category)
  const isAuthor = user?.id === current.author_id
  const canEdit = isAuthor || !current.is_sealed
  const photo = photoPublicUrl(current.photo_url)

  async function handleFavorite() {
    setFavBusy(true)
    const { error: favError } = await toggleFavorite(current.id, !!current.is_favorite)
    if (!favError) setRecipe({ ...current, is_favorite: !current.is_favorite })
    setFavBusy(false)
  }

  async function handleSeal() {
    const { error: sealError } = await sealRecipe(current.id, !current.is_sealed)
    if (!sealError) setRecipe({ ...current, is_sealed: !current.is_sealed })
  }

  async function handleDelete() {
    const { error: deleteError } = await deleteRecipe(current.id)
    if (!deleteError) navigate('/recettes', { replace: true })
  }

  return (
    <div className="space-y-6">
      <Link to="/recettes" className="inline-flex items-center gap-1 text-bleu font-bold min-h-11 hover:underline">
        <ArrowLeft size={18} aria-hidden="true" /> Retour au carnet
      </Link>

      {/* En-tête : photo + titre + tampon */}
      <Card className="p-0 overflow-hidden">
        <div className="relative aspect-[16/10] bg-lin">
          {photo ? (
            <img src={photo} alt={recipe.title} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-moutarde/25 to-terra/25 flex items-center justify-center">
              <span className="text-7xl" aria-hidden="true">{meta.emoji}</span>
            </div>
          )}
          <span className="absolute top-4 left-4 bg-creme/95 rounded-full px-4 py-1.5 font-bold text-terra">
            {meta.emoji} {meta.label}
          </span>
          {recipe.is_sealed && (
            <span className="absolute top-4 right-4 bg-creme/95 rounded-full px-4 py-1.5 font-bold text-encre inline-flex items-center gap-1.5">
              <Lock size={15} aria-hidden="true" /> Recette scellée
            </span>
          )}
        </div>
        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl font-bold">{recipe.title}</h1>
              {/* Origine : par qui, depuis quand */}
              <p className="text-hand text-bleu text-2xl mt-1">
                de la main de {recipe.author?.display_name ?? '…'}
                {recipe.author && (
                  <span className="text-encre-soft text-lg">
                    {' '}(recette certifiée de la part de {recipe.author.display_name})
                  </span>
                )}
              </p>
              <p className="text-sm text-encre-soft mt-1">
                dans le carnet depuis {formatDate(recipe.created_at)} · {formatRelative(recipe.created_at)}
              </p>
            </div>
            {recipe.author && (
              <Stamp name={recipe.author.display_name} emoji={recipe.author.stamp_emoji} />
            )}
          </div>

          {/* Meta : portions, temps */}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-encre-soft">
            <span className="inline-flex items-center gap-1.5 font-bold text-encre">
              <Users size={18} aria-hidden="true" />
              <span aria-live="polite">{effectiveServings} part{effectiveServings > 1 ? 's' : ''}</span>
              <span className="inline-flex">
                <button
                  type="button"
                  onClick={() => setServings(Math.max(1, effectiveServings - 1))}
                  aria-label="Une part de moins"
                  className="min-h-11 min-w-11 rounded-l-full border-2 border-encre/20 bg-creme hover:border-terra hover:text-terra inline-flex items-center justify-center"
                >
                  <Minus size={18} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setServings(effectiveServings + 1)}
                  aria-label="Une part de plus"
                  className="min-h-11 min-w-11 rounded-r-full border-2 border-l-0 border-encre/20 bg-creme hover:border-terra hover:text-terra inline-flex items-center justify-center"
                >
                  <Plus size={18} aria-hidden="true" />
                </button>
              </span>
            </span>
            {recipe.prep_time != null && recipe.prep_time > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Clock size={18} aria-hidden="true" /> Prépa {formatDuration(recipe.prep_time)}
              </span>
            )}
            {recipe.cook_time != null && recipe.cook_time > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Clock size={18} aria-hidden="true" /> Cuisson {formatDuration(recipe.cook_time)}
              </span>
            )}
          </div>

          {/* Origine du plat (authenticité) */}
          {recipe.origin_story && (
            <div className="mt-4 rounded-2xl border-2 border-dashed border-moutarde bg-moutarde/10 p-4">
              <p className="kicker">L’origine du plat</p>
              <p className="text-hand text-2xl text-bleu-dark">{recipe.origin_story}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 mt-5">
            <Button
              variant={recipe.is_favorite ? 'primary' : 'outline'}
              onClick={handleFavorite}
              disabled={favBusy}
              aria-pressed={recipe.is_favorite}
            >
              <Heart size={18} aria-hidden="true" className={cn(recipe.is_favorite && 'fill-creme')} />
              {recipe.is_favorite ? 'Dans mes favoris' : 'Ajouter aux favoris'}
            </Button>
            {canEdit && (
              <Link to={`/recettes/${recipe.id}/modifier`}>
                <Button variant="outline">
                  <Pencil size={18} aria-hidden="true" /> Modifier
                </Button>
              </Link>
            )}
            {isAuthor && (
              <Button variant="outline" onClick={handleSeal}>
                <Lock size={18} aria-hidden="true" />
                {recipe.is_sealed ? 'Desceller la recette' : 'Sceller la recette'}
              </Button>
            )}
            {isAuthor && (
              confirmDelete ? (
                <Button variant="danger" onClick={handleDelete}>
                  <Trash2 size={18} aria-hidden="true" /> Confirmer la suppression
                </Button>
              ) : (
                <Button variant="ghost" className="text-carmine" onClick={() => setConfirmDelete(true)}>
                  <Trash2 size={18} aria-hidden="true" /> Supprimer
                </Button>
              )
            )}
          </div>
          {isAuthor && !confirmDelete && (
            <p className="text-sm text-encre-soft mt-2">
              {recipe.is_sealed
                ? 'Recette scellée : seul toi peux modifier l’original.'
                : 'Sceller une recette la rend non modifiable — sauf par toi, son créateur.'}
            </p>
          )}
          {isAuthor && confirmDelete && (
            <p className="text-sm text-carmine font-bold mt-2">
              Effacer une recette, c’est perdre un peu de quelqu’un. Tu confirmes ?
            </p>
          )}
        </div>
      </Card>

      {/* Ingrédients */}
      <Card>
        <p className="kicker">Ce qu’il faut</p>
        <h2 className="text-2xl font-semibold mb-4">(et ce qu’on n’oublie jamais)</h2>
        {ingredients.length === 0 ? (
          <p className="text-encre-soft">Pas encore d’ingrédients notés.</p>
        ) : (
          <ul className="space-y-2">
            {ingredients.map((line, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="mt-1.5 w-2 h-2 rounded-full bg-terra shrink-0"
                  aria-hidden="true"
                />
                <span className="text-lg">{line}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Étapes */}
      <Card>
        <p className="kicker">La recette, étape par étape</p>
        <h2 className="text-2xl font-semibold mb-4">À ton tour de cuisiner</h2>
        {recipe.steps.length === 0 ? (
          <p className="text-encre-soft">Pas encore d’étapes notées.</p>
        ) : (
          <ol className="space-y-4">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-4">
                <span
                  className="w-9 h-9 rounded-full bg-terra text-creme font-serif font-bold flex items-center justify-center shrink-0"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <span className="text-lg pt-1">{step}</span>
              </li>
            ))}
          </ol>
        )}
      </Card>

      {/* Anecdote — mise en valeur */}
      {recipe.anecdote && (
        <Card className="bg-gradient-to-br from-creme to-bleu/10 border-bleu/25">
          <p className="kicker">Le secret</p>
          <h2 className="text-2xl font-semibold mb-3">— celui qu’on ne dit qu’à la famille</h2>
          <blockquote className="text-hand text-bleu-dark text-3xl leading-relaxed">
            « {recipe.anecdote} »
          </blockquote>
          <p className="mt-3 flex items-center gap-2 text-encre-soft">
            {recipe.author && <Avatar name={recipe.author.display_name} src={recipe.author.avatar_url} size="sm" />}
            <span>— {recipe.author?.display_name}</span>
          </p>
        </Card>
      )}

      {/* Transmission */}
      <Card className="flex items-center gap-4">
        {recipe.author && <Avatar name={recipe.author.display_name} src={recipe.author.avatar_url} size="lg" />}
        <div>
          <p className="kicker">Transmise par</p>
          <p className="font-serif text-xl font-semibold">{recipe.author?.display_name}</p>
          <p className="text-encre-soft">
            dans la famille depuis {formatDate(recipe.author?.created_at)} · recette ajoutée {formatRelative(recipe.created_at)}
          </p>
        </div>
      </Card>

      {/* v2 : mode cuisson (minuteur), déclinaisons, export PDF — volontairement non implémenté */}
      <p className="text-center text-sm text-encre-soft">
        <Link to="/recettes/nouvelle" className="text-terra font-bold hover:underline">
          Écrire une autre recette de la famille
        </Link>
      </p>
    </div>
  )
}
