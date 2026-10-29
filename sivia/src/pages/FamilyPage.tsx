import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Check, Copy, Download, Eye, Mail, Pencil, Trash2, UserCheck } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useCreateInvitation, useFamilyMembers, useInvitations } from '@/hooks/useFamily'
import { useFamilyGenerations, useFamilyTree } from '@/hooks/useFamilyTree'
import { useRecipes } from '@/hooks/useRecipes'
import { supabase } from '@/lib/supabase'
import { addComment } from '@/services/comments'
import { estimateBookPageCount, generateFamilyBookPdf } from '@/services/familyBookPdf'
import { invitationLink } from '@/lib/paths'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { TextInput } from '@/components/ui/FormFields'
import { Spinner } from '@/components/ui/Spinner'
import { FamilyTree } from '@/components/family/FamilyTree'
import { FamilyEvents } from '@/components/family/FamilyEvents'
import { formatDate } from '@/lib/format'
import { COPY } from '@/lib/copy'
import type { FamilyMember, Invitation } from '@/lib/types'

export function FamilyPage() {
  const { profile, family, refreshProfile } = useAuth()
  const { members, loading: membersLoading } = useFamilyMembers()
  const { invitations, loading: invitationsLoading, refetch } = useInvitations()
  const createInvitation = useCreateInvitation()
  const {
    members: treeMembers,
    loading: treeLoading,
    add: addTreeMember,
    edit: editTreeMember,
    remove: removeTreeMember,
  } = useFamilyTree()
  // Générations nommées : conservées en base pour historique (le modal les
  // propose encore en facultatif), mais l'arbre se construit désormais
  // uniquement à partir des liens entre personnes.
  const { generations } = useFamilyGenerations()

  // Profils connectés, pour le badge « membre connecté » de l'arbre
  const connectedProfileIds = useMemo(() => new Set(members.map((m) => m.id)), [members])

  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  // Génération du livre « carnet familial » (chantier 7)
  const { recipes, loading: recipesLoading } = useRecipes({
    query: '',
    category: 'toutes' as const,
    authorId: 'tous' as const,
  })
  const [bookBusy, setBookBusy] = useState(false)
  const [bookDone, setBookDone] = useState(false)
  const [bookError, setBookError] = useState<string | null>(null)
  const [bookPreviewOpen, setBookPreviewOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [lastLink, setLastLink] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Renommage de la famille
  const [editingName, setEditingName] = useState(false)
  const [familyName, setFamilyName] = useState(family?.name ?? '')
  const [renaming, setRenaming] = useState(false)
  const [renameError, setRenameError] = useState<string | null>(null)

  async function handleRename(e: FormEvent) {
    e.preventDefault()
    if (!family) return
    const name = familyName.trim()
    if (!name || name === family.name) {
      setEditingName(false)
      return
    }
    setRenaming(true)
    setRenameError(null)
    // En cas d'erreur, on recharge le profil : on retombe sur l'accueil après connexion
    const { error: updateError } = await supabase
      .from('families')
      .update({ name })
      .eq('id', family.id)
    if (updateError) {
      setRenameError('Impossible de renommer la famille pour le moment. Réessaie ?')
      setRenaming(false)
      return
    }
    await refreshProfile()
    setRenaming(false)
    setEditingName(false)
  }

  const pending = invitations.filter((i) => i.status === 'pending')

  async function handleInvite(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error: inviteError, invitation } = await createInvitation(email.trim())
    setSubmitting(false)
    if (inviteError || !invitation) {
      setError(inviteError ?? COPY.errors.generique)
      return
    }
    setEmail('')
    setLastLink(invitationLink(invitation.token))
    refetch()
  }

  async function cancelInvitation(invitation: Invitation) {
    await supabase.from('invitations').delete().eq('id', invitation.id)
    refetch()
  }

  async function copyLink(invitation: Invitation) {
    const link = invitationLink(invitation.token)
    await navigator.clipboard.writeText(link)
    setCopiedId(invitation.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function handleRemoveTreeMember(member: FamilyMember) {
    const { error: removeError } = await removeTreeMember(member.id)
    if (removeError) setError(removeError)
  }

  /** Télécharge le livre A5 du carnet familial + notification dans le fil de vie */
  async function handleDownloadBook() {
    if (!family || !profile) return
    setBookBusy(true)
    setBookError(null)
    try {
      const { pageCount } = await generateFamilyBookPdf({
        familyName: family.name,
        recipes,
        treeMembers,
        printedBy: profile.display_name,
      })
      setBookDone(true)
      setTimeout(() => setBookDone(false), 5000)
      // Notification dans le fil de vie (planche familiale, recipeId = null)
      await addComment(
        null,
        family.id,
        profile.id,
        `${profile.display_name} a téléchargé le carnet de ${family.name} (${pageCount} pages).`,
        null,
      )
    } catch {
      setBookError('Le carnet n\'a pas pu être téléchargé. La sauce a raté. On recommence ?')
    } finally {
      setBookBusy(false)
      setBookPreviewOpen(false)
    }
  }

  if (membersLoading || invitationsLoading || treeLoading)
    return <Spinner label={COPY.loading.famille} />

  return (
    <div className="space-y-8">
      <div>
        <p className="kicker">Le cercle</p>
        {editingName ? (
          <form onSubmit={handleRename} noValidate className="mt-1 flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              aria-label="Nouveau nom de la famille"
              className="min-h-11 rounded-xl border-2 border-encre/20 bg-creme px-4 py-2 text-2xl font-bold focus:border-terra focus:outline-none"
            />
            <Button type="submit" size="md" disabled={renaming || !familyName.trim()}>
              {renaming ? 'On écrit…' : 'Renommer'}
            </Button>
            <Button type="button" variant="ghost" size="md" onClick={() => setEditingName(false)}>
              Ranger
            </Button>
          </form>
        ) : (
          <h1 className="text-3xl font-bold mt-1 inline-flex items-center gap-2">
            {family?.name ?? 'Ta famille'}
            <button
              type="button"
              onClick={() => {
                setFamilyName(family?.name ?? '')
                setRenameError(null)
                setEditingName(true)
              }}
              aria-label="Renommer la famille"
              className="touch-target-lg min-h-11 min-w-11 rounded-full text-encre-soft hover:text-terra-dark inline-flex items-center justify-center"
            >
              <Pencil size={20} aria-hidden="true" />
            </button>
          </h1>
        )}
        {renameError && (
          <p className="text-carmine font-bold mt-1" role="alert">
            {renameError}
          </p>
        )}
        <p className="text-hand text-bleu-dark text-2xl mt-1">
          {members.length} membre{members.length > 1 ? 's' : ''} en cuisine
        </p>
      </div>

      {/* Membres (badges/blasons) */}
      <section aria-labelledby="members-title">
        <CardHeader kicker="Les membres" title="En cuisine" />
        <ul className="grid gap-3 sm:grid-cols-2">
          {members.map((member) => (
            <li key={member.id}>
              <Card className="flex items-center gap-4">
                <Avatar name={member.display_name} src={member.avatar_url} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-xl font-semibold truncate">
                    {member.display_name}
                    {member.id === profile?.id && (
                      <span className="text-sm text-terra-dark font-sans font-bold"> · toi</span>
                    )}
                  </p>
                  {member.family_role && (
                    <p className="text-hand text-bleu-dark text-2xl">{member.family_role}</p>
                  )}
                  {member.bio && <p className="text-sm text-encre-soft truncate">{member.bio}</p>}
                  <p className="text-sm text-encre-soft">En cuisine depuis {formatDate(member.created_at)}</p>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      {/* Arbre généalogique piloté par des « + » et des scotchs : une base, des branches selon l'emplacement */}
      <section aria-labelledby="tree-title">
        <CardHeader
          kicker="L'arbre généalogique"
          title="La famille, fil par fil"
        />
        <p className="text-sm text-encre-soft mb-4">
          Un membre <span className="inline-flex items-center gap-1 font-bold text-bleu-dark"><UserCheck size={14} aria-hidden="true" /> connecté</span> a
          un compte Savia. Un membre ajouté « de l'arbre » n'en a pas — mamie Jeanne, par exemple —
          mais elle peut être citée comme origine d'une recette. L'arbre grandit avec les « + » :
          en dessous d'une personne pour un enfant, sur le scotch « + » du côté pour un partenaire
          (à côté, même génération), et le « + » carmine en haut pour un aîné au-dessus. Le lien
          s'écrit librement sur la carte.
        </p>
        <div className="card-surface card-pad p-5 bg-sauge/5">
          <FamilyTree
            members={treeMembers}
            generations={generations}
            connectedProfileIds={connectedProfileIds}
            onRemoveMember={handleRemoveTreeMember}
            onCreateMember={addTreeMember}
            onUpdateMember={editTreeMember}
          />
        </div>
      </section>

      {/* Le carnet familial : le livre (chantier 7) */}
      <section aria-labelledby="book-title">
        <Card>
          <CardHeader kicker="Le livre" title={`Télécharger le carnet de ${family?.name ?? 'ta famille'}`} />
          <p className="text-encre-soft mb-4">
            Toutes les recettes de la famille réunies en un livre A5 : couverture, sommaire,
            recettes scellées d'abord, index par auteur. {recipes.length} recette{recipes.length > 1 ? 's' : ''} au compteur.
          </p>
          {bookError && (
            <p className="text-carmine font-bold mb-3" role="alert">{bookError}</p>
          )}
          {bookDone && (
            <p className="text-sauge-ink font-bold mb-3" role="status">
              Le carnet est dans vos téléchargements. {profile?.display_name} a téléchargé le carnet — la famille le sait.
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => setBookPreviewOpen(true)}
              disabled={recipesLoading || recipes.length === 0}
            >
              <Eye size={18} aria-hidden="true" />
              Aperçu
            </Button>
            <Button
              onClick={handleDownloadBook}
              disabled={bookBusy || recipesLoading || recipes.length === 0}
            >
              <Download size={18} aria-hidden="true" />
              {bookBusy ? 'On relie le carnet…' : 'Télécharger le carnet'}
            </Button>
          </div>
        </Card>
      </section>

      {/* Événements & souvenirs : la chronologie des repas de famille */}
      <FamilyEvents />

      {/* Inviter */}
      <section aria-labelledby="invite-title">
        <Card>
          <CardHeader kicker="Inviter" title="Ouvrir la porte à quelqu’un" />
          <form onSubmit={handleInvite} noValidate className="space-y-4">
            <TextInput
              label="L’adresse mail de ton invité"
              htmlFor="invite-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mamie@famille.fr"
              hint="On génère un lien d’invitation sécurisé — à lui de l’accepter."
            />
            {error && <p className="text-carmine font-bold" role="alert">{error}</p>}
            <Button type="submit" disabled={submitting || !email.trim()}>
              <Mail size={18} aria-hidden="true" />
              {submitting ? 'On prépare le lien…' : 'Créer le lien d’invitation'}
            </Button>
          </form>
          {lastLink && (
            <div className="mt-4 rounded-2xl bg-sauge/15 p-4">
              <p className="font-bold mb-2">Lien d’invitation tout frais :</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={lastLink}
                  aria-label="Lien d’invitation"
                  className="flex-1 min-h-11 rounded-xl border-2 border-encre/20 bg-creme px-3 text-sm"
                  onFocus={(e) => e.target.select()}
                />
                <Button
                  variant="outline"
                  aria-label="Copier le lien"
                  onClick={async () => {
                    await navigator.clipboard.writeText(lastLink)
                    setCopiedId('last')
                    setTimeout(() => setCopiedId(null), 2000)
                  }}
                >
                  {copiedId === 'last' ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
                </Button>
              </div>
              <p className="text-sm text-encre-soft mt-2">
                Envoie-le par SMS ou mail. Ton invité n’aura qu’à le suivre pour rejoindre la famille.
              </p>
            </div>
          )}
        </Card>
      </section>

      {/* Invitations en attente */}
      {pending.length > 0 && (
        <section aria-labelledby="pending-title">
          <CardHeader kicker="En attente" title="Ils n’ont pas encore répondu" />
          <ul className="space-y-3">
            {pending.map((invitation) => (
              <li key={invitation.id}>
                <Card className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{invitation.email}</p>
                    <p className="text-sm text-encre-soft">Invité le {formatDate(invitation.created_at)}</p>
                  </div>
                  <Button variant="outline" onClick={() => copyLink(invitation)} aria-label={`Copier le lien pour ${invitation.email}`}>
                    {copiedId === invitation.id ? (
                      <Check size={18} aria-hidden="true" />
                    ) : (
                      <Copy size={18} aria-hidden="true" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-carmine"
                    onClick={() => cancelInvitation(invitation)}
                    aria-label={`Retirer l’invitation de ${invitation.email}`}
                  >
                    <Trash2 size={18} aria-hidden="true" />
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-center text-encre-soft">
        <Link to="/profil" className="text-terra-dark font-bold hover:underline">
          Gérer mon profil
        </Link>
      </p>

      {/* Aperçu avant génération du livre — mini couverture stylisée */}
      {bookPreviewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-encre/40 backdrop-blur-sm p-4"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setBookPreviewOpen(false)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="book-preview-title"
            className="card-surface w-full max-w-md p-6"
          >
            {/* Mini couverture — aperçu visuel du carnet A5 */}
            <div
              aria-hidden="true"
              className="mb-5 rounded-2xl bg-moutarde-soft px-6 py-8 text-center shadow-soft"
            >
              <p className="kicker">Savia</p>
              <p className="font-serif text-2xl font-bold text-encre mt-2 leading-tight">
                Le carnet de<br />{family?.name ?? 'ta famille'}
              </p>
              <p className="text-hand text-terra-dark text-2xl mt-1">Le savoir qui se transmet à table.</p>
              <span className="inline-block mt-3 h-8 w-8 rounded-full border-2 border-carmine/70" aria-hidden="true" />
              <p className="text-sm text-encre-soft mt-3">
                {recipes.length} recette{recipes.length > 1 ? 's' : ''} · {estimateBookPageCount(recipes.length).label}
              </p>
            </div>
            <h2 id="book-preview-title" className="sr-only">
              Aperçu du carnet de {family?.name ?? 'ta famille'}
            </h2>
            <p className="text-encre-soft mb-1">Pour qui ? Toute la famille, de génération en génération.</p>
            <p className="text-encre-soft mb-4">
              Couverture, sommaire, recettes scellées d'abord, index par auteur.
            </p>
            <div className="flex flex-col gap-3">
              <Button size="lg" onClick={handleDownloadBook} disabled={bookBusy}>
                <Download size={18} aria-hidden="true" />
                {bookBusy ? 'On relie le carnet…' : 'Télécharger le carnet'}
              </Button>
              <Button size="lg" variant="ghost" onClick={() => setBookPreviewOpen(false)}>
                Ranger
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
