import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  Clock,
  Download,
  Heart,
  Lock,
  Minus,
  Pencil,
  Play,
  Plus,
  Trash2,
  Users,
} from 'lucide-react'
import { useRecipe, useToggleFavorite } from '@/hooks/useRecipes'
import { useAuth } from '@/context/AuthContext'
import { deleteRecipe, photoPublicUrl, sealRecipe } from '@/services/recipes'
import { printRecipe } from '@/services/recipePrint'
import { categoryMeta } from '@/lib/constants'
import { formatDate, formatDuration, formatRelative } from '@/lib/format'
import { scaleIngredients } from '@/lib/scale'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { Stamp } from '@/components/ui/Stamp'
import { CommentThread } from '@/components/recipes/CommentThread'
import { IngredientChecklist } from '@/components/recipes/IngredientChecklist'
import { TransmissionBanner } from '@/components/recipes/TransmissionBanner'
import { Torchon } from '@/components/ui/Torchon'
import { useCookedCount } from '@/hooks/useCookedCount'
import { cn } from '@/lib/utils'
import { COPY } from '@/lib/copy'

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { recipe, loading, error, setRecipe } = useRecipe(id)
  const { user, family } = useAuth()
  const toggleFavorite = useToggleFavorite()
  const navigate = useNavigate()

  const [servings, setServings] = useState<number | null>(null)
  const [favBusy, setFavBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  // Pulsation douce du bouton « Cuisiner » : une seule fois par session
  // (désactivée ensuite pour le reste de la session)
  const [cookPulse] = useState(() => {
    if (typeof sessionStorage === 'undefined') return false
    const key = `savia-cook-pulse-${id}`
    if (sessionStorage.getItem(key)) return false
    sessionStorage.setItem(key, '1')
    return true
  })
  const cookedCount = useCookedCount(id)
  // Export « carnet familial » : confirmation après le téléchargement
  const [exported, setExported] = useState(false)

  const effectiveServings = servings ?? recipe?.servings ?? 4

  const ingredients = useMemo(() => {
    if (!recipe) return []
    return scaleIngredients(recipe.ingredients, recipe.servings, effectiveServings)
  }, [recipe, effectiveServings])

  if (loading) return <Spinner label={COPY.loading.recette} />
  if (error || !recipe) {
    return (
      <EmptyState title="Cette recette a dû sortir du four" handText={COPY.empty.recetteIntrouvable}>
        <Link to="/recettes">
          <Button variant="outline">{COPY.nav.retourCarnet}</Button>
        </Link>
      </EmptyState>
    )
  }

  // À partir d'ici, recipe est défini (garde ci-dessus)
  const current = recipe
  const meta = categoryMeta(current.category)

  function handleExport() {
    const opened = printRecipe(current, family?.name ?? 'notre famille')
    if (opened) {
      setExported(true)
      setTimeout(() => setExported(false), 4000)
    }
  }
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
            <Torchon label={meta.label} className="[&>span]:w-24 [&>span]:h-24 [&>span]:text-5xl" />
          )}
          <span className="absolute top-4 left-4 bg-creme/95 rounded-full px-4 py-1.5 font-bold text-terra">
            {meta.label}
          </span>
          {recipe.is_sealed && (
            <span className="absolute top-4 right-4 bg-creme/95 rounded-full px-4 py-1.5 font-bold text-carmine inline-flex items-center gap-1.5">
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
                créée par {recipe.author?.display_name ?? '…'}
                {recipe.author?.family_role && (
                  <span className="text-encre-soft text-lg"> ({recipe.author.family_role})</span>
                )}
              </p>
              <p className="text-sm text-encre-soft mt-1">
                dans le carnet depuis {formatDate(recipe.created_at)} · {formatRelative(recipe.created_at)}
              </p>
            </div>
            {recipe.author && (
              <span className="stamp-in inline-block">
                <Stamp name={recipe.author.display_name} rotate={-2} className="opacity-90" />
              </span>
            )}
          </div>

          {/* Bandeau transmission : point de couture */}
          <div className="mt-4">
            <TransmissionBanner
              author={recipe.author}
              recipeCreatedAt={recipe.created_at}
              cookedCount={cookedCount}
            />
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
                  className="min-h-12 min-w-12 rounded-l-full border-2 border-encre/20 bg-creme hover:border-terra hover:text-terra inline-flex items-center justify-center"
                >
                  <Minus size={18} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setServings(effectiveServings + 1)}
                  aria-label="Une part de plus"
                  className="min-h-12 min-w-12 rounded-r-full border-2 border-l-0 border-encre/20 bg-creme hover:border-terra hover:text-terra inline-flex items-center justify-center"
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
            {/* Mode cuisson : diaporama plein écran, une étape à la fois */}
            {recipe.steps.length > 0 && (
              <Link to={'/recettes/' + recipe.id + '/cuisson'}>
                <Button variant="primary">
                  <Play size={18} aria-hidden="true" /> Cuisiner
                </Button>
              </Link>
            )}
            {/* Export PDF « carnet familial » (mise en forme originale, polaroïd + tampon) */}
            <Button variant="outline" onClick={handleExport}>
              {exported ? <Check size={18} aria-hidden="true" /> : <Download size={18} aria-hidden="true" />}
              {exported ? 'Préparé — choisis « Enregistrer en PDF »' : 'Télécharger la recette'}
            </Button>
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
                  <Trash2 size={18} aria-hidden="true" /> Oui, retirer du carnet
                </Button>
              ) : (
                <Button variant="ghost" className="text-carmine" onClick={() => setConfirmDelete(true)}>
                  <Trash2 size={18} aria-hidden="true" /> {COPY.actions.retirer}
                </Button>
              )
            )}
          </div>
          {isAuthor && !confirmDelete && (
            <p className="text-sm text-encre-soft mt-2">
              {recipe.is_sealed
                ? 'Recette scellée : tu es le seul à pouvoir modifier l’original.'
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
          <IngredientChecklist lines={ingredients} />
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

      {/* Anecdote — mise en valeur : papier âgé, bord ondulé, en exergue */}
      {recipe.anecdote && (
        <Card className="paper-aged border-transparent shadow-soft px-6 pt-5 pb-7 anim-enter">
          <p className="kicker">Le secret</p>
          <h2 className="text-2xl font-semibold mb-3">— celui qu’on ne dit qu’à la famille</h2>
          <blockquote className="text-hand text-[#5b4632] text-3xl leading-relaxed">
            « {recipe.anecdote} »
          </blockquote>
          <p className="mt-3 flex items-center gap-2 text-encre-soft">
            {recipe.author && <Avatar name={recipe.author.display_name} src={recipe.author.avatar_url} size="sm" />}
            <span>— {recipe.author?.display_name}</span>
          </p>
        </Card>
      )}

      {/* Fil de vie : commentaires et photos de la famille */}
      <CommentThread recipeId={recipe.id} familyId={recipe.family_id} />

      {/* Bouton « Cuisiner » sticky en bas de fiche (au-dessus de la nav fixe) */}
      {recipe.steps.length > 0 && (
        <div className="sticky bottom-20 z-30 flex justify-center pointer-events-none">
          <Link to={'/recettes/' + recipe.id + '/cuisson'} className="pointer-events-auto">
            <Button size="lg" className={cn('shadow-soft', cookPulse && 'pulse-once')}>
              <Play size={20} aria-hidden="true" /> Cuisiner
            </Button>
          </Link>
        </div>
      )}

      <p className="text-center text-sm text-encre-soft mt-2">
        <Link to="/recettes/nouvelle" className="text-terra font-bold hover:underline">
          Écrire une autre recette de la famille
        </Link>
      </p>
    </div>
  )
}
