import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  ChefHat,
  Clock,
  Download,
  Heart,
  Lock,
  LockKeyhole,
  LockKeyholeOpen,
  Minus,
  Pencil,
  Play,
  Plus,
  Printer,
  Trash2,
  Users,
} from 'lucide-react'
import { useRecipe, useToggleFavorite } from '@/hooks/useRecipes'
import { useCooks } from '@/hooks/useCooks'
import { useAuth } from '@/context/AuthContext'
import { usePageTitle } from '@/lib/usePageTitle'
import { deleteRecipe, photoPublicUrl, sealRecipe } from '@/services/recipes'
import { printRecipe } from '@/services/recipePrint'
import { generateRecipePdf } from '@/services/recipePdf'
import { categoryMeta } from '@/lib/constants'
import { formatDate, formatDuration, formatRelative } from '@/lib/format'
import { scaleIngredients } from '@/lib/scale'
import { scrollVersMilieu } from '@/lib/scroll'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { Stamp } from '@/components/ui/Stamp'
import { CommentThread } from '@/components/recipes/CommentThread'
import { SignalerButton } from '@/components/ui/SignalerButton'
import { IngredientChecklist } from '@/components/recipes/IngredientChecklist'
import { TransmissionBanner } from '@/components/recipes/TransmissionBanner'
import { Torchon } from '@/components/ui/Torchon'
import { useCookedCount } from '@/hooks/useCookedCount'
import { useFamillePlan } from '@/hooks/useFamillePlan'
import { PaywallModal } from '@/components/monetisation/PaywallModal'
import { PremiumGate } from '@/components/monetisation/PremiumGate'
import { cn } from '@/lib/utils'
import { COPY } from '@/lib/copy'
import { CategoryTrace } from '@/components/motifs/CategoryTrace'

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { recipe, loading, error, setRecipe } = useRecipe(id)
  const { user, family } = useAuth()
  usePageTitle(recipe?.title ?? 'Recette')
  const toggleFavorite = useToggleFavorite()
  const navigate = useNavigate()

  const [servings, setServings] = useState<number | null>(null)
  const [favBusy, setFavBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  // Pulsation douce du bouton « Cuisiner » : une seule fois par session
  // (désactivée ensuite pour le reste de la session)
  const [cookPulse] = useState(() => {
    if (typeof sessionStorage === 'undefined') return false
    const key = `sivia-cook-pulse-${id}`
    if (sessionStorage.getItem(key)) return false
    sessionStorage.setItem(key, '1')
    return true
  })
  const cookedCount = useCookedCount(id)
  // « Je l'ai faite ! » : qui a refait la recette (généalogie du plat)
  const { cooks, mine, busy: cookedBusy, mark: markCookedByMe, unmark: unmarkCookedByMe } = useCooks(id, user?.id)
  // Export « carnet familial » : confirmation après le téléchargement
  const [exported, setExported] = useState(false)
  const [pdfBusy, setPdfBusy] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [pdfDone, setPdfDone] = useState(false)
  // Sivia Plus : la conservation (PDF, impression) est le cœur du plan —
  // consulter et contribuer restent toujours gratuits
  const { premium, dejaEssai, refetch: refetchPlan } = useFamillePlan()
  const [paywallOpen, setPaywallOpen] = useState(false)

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
    if (!premium) {
      scrollVersMilieu()
      setPaywallOpen(true)
      return
    }
    const opened = printRecipe(current, family?.name ?? 'notre famille')
    if (opened) {
      setExported(true)
      setTimeout(() => setExported(false), 4000)
    }
  }

  /** Export PDF direct (jsPDF, import dynamique au clic) */
  async function handlePdfExport() {
    if (!premium) {
      scrollVersMilieu()
      setPaywallOpen(true)
      return
    }
    setPdfBusy(true)
    setPdfError(null)
    try {
      await generateRecipePdf(current, family?.name ?? 'notre famille')
      setPdfDone(true)
      setTimeout(() => setPdfDone(false), 4000)
    } catch {
      setPdfError(COPY.errors.reseau)
    } finally {
      setPdfBusy(false)
    }
  }
  const isAuthor = user?.id === current.author_id
  const canEdit = isAuthor || !current.is_sealed
  const photo = photoPublicUrl(current.photo_url)
  const cardPhoto = photoPublicUrl(current.card_url)

  /** « Je l'ai faite » : retrait direct, sans confirmation — l'action est réversible */
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
    <div className="relative space-y-6">
      {/* Trace d'ingrédient de la catégorie : une seule, sous le contenu (§8) —
          la texture parle d'elle-même, sans dénomination à côté */}
      <CategoryTrace category={current.category} />
      <Link to="/recettes" className="relative inline-flex items-center gap-1 text-vert font-bold min-h-11 hover:underline">
        <ArrowLeft size={18} aria-hidden="true" /> Retour au carnet
      </Link>

      {/* En-tête : photo + titre + tampon */}
      <Card className="p-0 overflow-hidden">
        <div className="relative aspect-[16/10] bg-papier">
          {photo ? (
            <img src={photo} alt={recipe.title} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <Torchon label={meta.label} className="[&>span]:w-24 [&>span]:h-24 [&>span]:text-5xl" />
          )}
          <span className="absolute top-3 left-3 bg-carte/95 rounded-full px-3 py-1 font-extrabold text-[11px] uppercase tracking-[0.12em] text-tomate">
            {meta.label}
          </span>
          {recipe.is_sealed && (
            <span className="absolute top-3 right-3 bg-carte/95 rounded-full px-3 py-1 font-bold text-[11px] text-tomate inline-flex items-center gap-1.5">
              <Lock size={15} aria-hidden="true" /> Recette scellée
            </span>
          )}
        </div>
        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <p className="folio mb-1 !text-left">Recette n° {recipe.id.slice(0, 8)}</p>
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold">{recipe.title}</h1>
              {/* Origine : par qui, depuis quand */}
              <p className="font-serif italic text-encre-doux text-lg mt-1">
                transmise par {recipe.author?.display_name ?? '…'}
                {recipe.author?.family_role && (
                  <span className="text-encre-doux text-lg"> ({recipe.author.family_role})</span>
                )}
              </p>
              <p className="text-sm font-bold text-encre-doux mt-1">
                dans le carnet depuis {formatDate(recipe.created_at)} · {formatRelative(recipe.created_at)}
              </p>
              {(recipe.family_favorites ?? 0) >= 2 && (
                <span className="estampille mt-3" role="img" aria-label="Testée et approuvée par la famille">
                  Testée &amp; approuvée
                </span>
              )}
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
          <div className="flex flex-wrap items-center gap-4 mt-4 text-encre-doux">
            <span className="inline-flex items-center gap-1.5 font-bold text-encre">
              <Users size={18} aria-hidden="true" />
              <span aria-live="polite">{effectiveServings} part{effectiveServings > 1 ? 's' : ''}</span>
              <span className="inline-flex shrink-0 rounded-full border-2 border-encre-doux/35 bg-carte hover:border-vert">
                <button
                  type="button"
                  onClick={() => setServings(Math.max(1, effectiveServings - 1))}
                  aria-label="Une part de moins"
                  className="touch-target-lg min-h-11 min-w-11 hover:text-vert inline-flex items-center justify-center"
                >
                  <Minus size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setServings(effectiveServings + 1)}
                  aria-label="Une part de plus"
                  className="touch-target-lg min-h-11 min-w-11 hover:text-vert inline-flex items-center justify-center"
                >
                  <Plus size={16} aria-hidden="true" />
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
            <div className="mt-4 rounded-2xl bg-ble-clair p-4">
              <p className="kicker">L’origine du plat</p>
              <p className="font-serif italic text-lg text-encre">{recipe.origin_story}</p>
            </div>
          )}

          {/* Actions — fines et lisibles : la cuisine d'abord, le carnet ensuite,
              l'espace créateur (scellé, retrait) regroupé et discret en dernier.
              Taille sm partout (44 px, seuil WCAG) : visuellement compact, tactile intact. */}
          <div className="flex flex-wrap items-center gap-2 mt-5">
            {/* Mode cuisson : diaporama plein écran, une étape à la fois */}
            {recipe.steps.length > 0 && (
              <Link to={'/recettes/' + recipe.id + '/cuisson'}>
                <Button size="sm" variant="primary">
                  <Play size={16} aria-hidden="true" /> Cuisiner
                </Button>
              </Link>
            )}
            {/* « Je l'ai faite ! » : le petit bouton de fierté, la recette vit */}
            {mine ? (
              <Button size="sm" variant="primary" onClick={() => unmarkCookedByMe()} disabled={cookedBusy}>
                <ChefHat size={16} aria-hidden="true" /> Tu l'as faite !
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => markCookedByMe()} disabled={cookedBusy}>
                <ChefHat size={16} aria-hidden="true" /> Je l'ai faite !
              </Button>
            )}
            <Button
              size="sm"
              variant={recipe.is_favorite ? 'soft' : 'outline'}
              onClick={handleFavorite}
              disabled={favBusy}
              aria-pressed={recipe.is_favorite}
            >
              <Heart size={16} aria-hidden="true" className={cn(recipe.is_favorite && 'fill-vert')} />
              {recipe.is_favorite ? 'Dans mes favoris' : 'Favoris'}
            </Button>
            {canEdit && (
              <Link to={`/recettes/${recipe.id}/modifier`}>
                <Button size="sm" variant="ghost">
                  <Pencil size={16} aria-hidden="true" /> Modifier
                </Button>
              </Link>
            )}
          </div>

          {/* Conservation (Sivia Plus) : PDF et impression, compacts —
              le petit cadenas renvoie au plan, pas au scellé (icônes distinctes) */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Button size="sm" variant="ghost" onClick={handlePdfExport} disabled={pdfBusy}>
              {pdfDone ? <Check size={16} aria-hidden="true" /> : <Download size={16} aria-hidden="true" />}
              {pdfBusy ? 'On prépare le PDF…' : pdfDone ? 'La recette est dans vos téléchargements' : 'PDF'}
              {!premium && <Lock size={12} aria-hidden="true" aria-label="Sivia Plus" />}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleExport}>
              {exported ? <Check size={16} aria-hidden="true" /> : <Printer size={16} aria-hidden="true" />}
              {exported ? 'Prêt — « Enregistrer en PDF »' : 'Imprimer'}
              {!premium && <Lock size={12} aria-hidden="true" aria-label="Sivia Plus" />}
            </Button>
            {pdfError && (
              <p className="text-sm text-tomate font-bold" role="alert">{pdfError}</p>
            )}
          </div>

          {/* Espace créateur : sceller (cadenas seul, distinct du cadenas premium)
              et retirer, discrets — sous les actions principales */}
          {isAuthor && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Button
                size="sm"
                variant="ghost"
                className="min-w-11 px-2 text-cannelle hover:text-encre"
                onClick={handleSeal}
                aria-pressed={recipe.is_sealed}
                aria-label={
                  recipe.is_sealed
                    ? 'Desceller la recette : elle redevient modifiable par tous'
                    : 'Sceller la recette : plus personne ne peut la modifier, sauf toi'
                }
                title={recipe.is_sealed ? 'Desceller la recette' : 'Sceller la recette'}
              >
                {recipe.is_sealed ? (
                  <LockKeyhole size={16} aria-hidden="true" />
                ) : (
                  <LockKeyholeOpen size={16} aria-hidden="true" />
                )}
              </Button>
              <p className="text-xs text-encre-doux">
                {recipe.is_sealed
                  ? 'Recette scellée : tu es le seul à pouvoir modifier l’original.'
                  : 'Sceller la recette : personne ne pourra la modifier, sauf toi.'}
              </p>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="ml-auto inline-flex items-center gap-1.5 min-h-11 px-1 text-sm font-bold text-tomate/80 hover:text-tomate"
              >
                <Trash2 size={15} aria-hidden="true" /> {COPY.actions.retirer}
              </button>
            </div>
          )}
          {isAuthor && confirmDelete && (
            <div className="mt-2 flex justify-end">
              <ConfirmDialog
                title="Retirer du carnet ?"
                message="Effacer une recette, c’est perdre un peu de quelqu’un."
                onCancel={() => setConfirmDelete(false)}
                onConfirm={handleDelete}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Ingrédients */}
      <hr className="filet-double" />
      <Card className="relative">
        <p className="kicker">Ce qu’il faut</p>
        <h2 className="text-2xl font-semibold mb-4">(et ce qu’on n’oublie jamais)</h2>
        {ingredients.length === 0 ? (
          <p className="text-encre-doux">Pas encore d’ingrédients notés.</p>
        ) : (
          <IngredientChecklist lines={ingredients} />
        )}
      </Card>

      {/* Étapes */}
      <hr className="filet-double" />
      <Card className="relative">
        <p className="kicker">La recette, étape par étape</p>
        <h2 className="text-2xl font-semibold mb-4">À ton tour de cuisiner</h2>
        {recipe.steps.length === 0 ? (
          <p className="text-encre-doux">Pas encore d’étapes notées.</p>
        ) : (
          <ol className="space-y-4">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-4">
                <span
                  className="h-9 w-9 rounded-full bg-tomate text-white font-serif font-bold text-lg flex items-center justify-center shrink-0"
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

      {/* La carte manuscrite originale — le papier d'avant, l'écriture d'avant */}
      {cardPhoto && (
        <aside className="marge-note anim-enter flex justify-center" aria-label="La carte manuscrite originale">
          <figure className="polaroid relative w-[240px] rotate-[2deg]">
            <span className="epingle" aria-hidden="true" />
            <img
              src={cardPhoto}
              alt="La carte manuscrite originale"
              className="w-full rounded-sm"
            />
            <figcaption className="font-serif italic text-[11.5px] text-cannelle text-center pt-1.5">
              La carte originale — l'écriture d'avant
            </figcaption>
          </figure>
        </aside>
      )}

      {/* Généalogie de la recette : écrite par l'un, refaite par les autres */}
      {cooks.length > 0 && (
        <>
          <hr className="filet-double" />
          <Card className="relative">
            <p className="kicker">De génération en génération</p>
            <h2 className="text-2xl font-semibold mb-4">La petite histoire de ce plat</h2>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                {recipe.author && (
                  <Avatar name={recipe.author.display_name} src={recipe.author.avatar_url} size="sm" />
                )}
                <span className="text-lg">
                  <strong className="text-encre">Écrite par {recipe.author?.display_name ?? '…'}</strong>{' '}
                  <span className="text-encre-doux">· {formatDate(recipe.created_at)}</span>
                </span>
              </li>
              {cooks.map((c) => (
                <li key={c.id} className="flex items-center gap-3">
                  <Avatar name={c.cook?.display_name ?? '…'} src={c.cook?.avatar_url} size="sm" />
                  <span className="text-lg">
                    <strong className="text-encre">Refaite par {c.cook?.display_name ?? '…'}</strong>{' '}
                    <span className="text-encre-doux">
                      · {formatDate(c.cooked_at)}{c.user_id === user?.id ? ' (toi)' : ''}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}

      {/* Anecdote — marginalia : 1 note max par page, astuces transmises (§7) */}
      {recipe.anecdote && (
        <aside className="marge-note anim-enter" aria-label="Le secret de la famille">
          <p className="kicker mb-2">Le secret — celui qu’on ne dit qu’à la famille</p>
          <p className="font-serif italic text-encre text-2xl leading-relaxed">
            « {recipe.anecdote} »
          </p>
          <p className="mt-3 flex items-center gap-2 text-encre-doux font-bold not-italic">
            {recipe.author && <Avatar name={recipe.author.display_name} src={recipe.author.avatar_url} size="sm" />}
            <span>— {recipe.author?.display_name}</span>
          </p>
        </aside>
      )}

      {/* Fil de vie : commentaires et photos de la famille (Sivia Plus) */}
      {premium ? (
        <CommentThread recipeId={recipe.id} familyId={recipe.family_id} />
      ) : (
        <PremiumGate
          title="Le fil de vie de cette recette"
          description="Qui l’a cuisinée, quand, avec quels mots et quelles photos : les souvenirs de la famille se collectionnent ici, recette après recette."
          openPaywall={() => setPaywallOpen(true)}
        >
          <CommentThread recipeId={recipe.id} familyId={recipe.family_id} />
        </PremiumGate>
      )}

      {/* Bouton « Cuisiner » sticky en bas de fiche (au-dessus de la nav fixe) */}
      {recipe.steps.length > 0 && (
        <div className="sticky bottom-20 z-30 flex justify-center pointer-events-none">
          <Link to={'/recettes/' + recipe.id + '/cuisson'} className="pointer-events-auto">
            <Button size="lg" className={cn(cookPulse && 'pulse-once')}>
              <Play size={20} aria-hidden="true" /> Cuisiner
            </Button>
          </Link>
        </div>
      )}

      <p className="text-center text-sm text-encre-doux mt-2">
        <Link to="/recettes/nouvelle" className="text-vert font-bold hover:underline">
          Écrire une autre recette de la famille
        </Link>
      </p>

      {/* DSA, art. 16 : signalement discret, au bas de la fiche */}
      <p className="text-center text-sm text-encre-doux/60 mt-1">
        <SignalerButton variant="link" label={`la recette « ${recipe.title} »`} />
      </p>

      {/* Sivia Plus : ouvert au moment de fierté (imprimer / conserver) */}
      <PaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        contexte={`Imprimer « ${recipe.title} » et l’offrir, sans filigrane`}
        onEssaiActif={refetchPlan}
        onRefresh={refetchPlan}
        dejaEssai={dejaEssai}
      />
    </div>
  )
}
