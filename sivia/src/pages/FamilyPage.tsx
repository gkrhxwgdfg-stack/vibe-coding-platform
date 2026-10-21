import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Check, Copy, Mail, Pencil, Plus, Trash2, UserCheck } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useCreateInvitation, useFamilyMembers, useInvitations } from '@/hooks/useFamily'
import { useFamilyGenerations, useFamilyTree } from '@/hooks/useFamilyTree'
import { supabase } from '@/lib/supabase'
import { invitationLink } from '@/lib/paths'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { TextInput } from '@/components/ui/FormFields'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { FamilyTree } from '@/components/family/FamilyTree'
import { FamilyMemberModal } from '@/components/family/FamilyMemberModal'
import { FamilyEvents } from '@/components/family/FamilyEvents'
import { formatDate } from '@/lib/format'
import type { FamilyMember, Invitation } from '@/lib/types'

export function FamilyPage() {
  const { profile, family, refreshProfile } = useAuth()
  const location = useLocation()
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
  const [memberModalOpen, setMemberModalOpen] = useState(false)
  /** Membre en cours d'édition dans le modal (null = création) */
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)

  // Profils connectés, pour le badge « membre connecté » de l'arbre
  const connectedProfileIds = useMemo(() => new Set(members.map((m) => m.id)), [members])

  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
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
      setError(inviteError ?? 'Impossible de créer l’invitation.')
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

  function handleRemoveTreeMember(member: FamilyMember) {
    if (window.confirm(`Retirer ${member.first_name} de l'arbre ?`)) {
      void removeTreeMember(member.id)
    }
  }

  function handleEditTreeMember(member: FamilyMember) {
    setEditingMember(member)
    setMemberModalOpen(true)
  }

  function handleOpenCreateModal() {
    setEditingMember(null)
    setMemberModalOpen(true)
  }

  // Le « + » contextuel de la coque renvoie ici avec openAddMember :
  // on ouvre directement le modal d'ajout de membre.
  const openAddMemberRequested =
    (location.state as { openAddMember?: boolean } | null)?.openAddMember === true
  useEffect(() => {
    if (openAddMemberRequested) {
      setEditingMember(null)
      setMemberModalOpen(true)
      // Nettoie le state pour ne pas rouvrir le modal à chaque navigation
      window.history.replaceState({}, '')
    }
  }, [openAddMemberRequested])

  if (membersLoading || invitationsLoading || treeLoading)
    return <Spinner label="On rassemble la famille…" />

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
              Annuler
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
              className="min-h-11 min-w-11 rounded-full text-encre-soft hover:text-terra inline-flex items-center justify-center"
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
        <p className="text-hand text-bleu text-2xl mt-1">
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
                      <span className="text-sm text-terra font-sans font-bold"> · toi</span>
                    )}
                  </p>
                  {member.family_role && (
                    <p className="text-hand text-bleu text-xl">{member.family_role}</p>
                  )}
                  {member.bio && <p className="text-sm text-encre-soft truncate">{member.bio}</p>}
                  <p className="text-xs text-encre-soft">En cuisine depuis {formatDate(member.created_at)}</p>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      {/* Arbre généalogique : membres de l'arbre (sans compte) + membres connectés */}
      <section aria-labelledby="tree-title">
        <CardHeader
          kicker="L'arbre généalogique"
          title="La famille, fil par fil"
          action={
            <Button onClick={handleOpenCreateModal} aria-label="Ajouter un membre à l'arbre">
              <Plus size={18} aria-hidden="true" /> Ajouter un membre
            </Button>
          }
        />
        <p className="text-sm text-encre-soft mb-4">
          Un membre <span className="inline-flex items-center gap-1 font-bold text-bleu"><UserCheck size={14} aria-hidden="true" /> connecté</span> a
          un compte Savia. Un membre ajouté « de l'arbre » n'en a pas — mamie Jeanne, par exemple —
          mais elle peut être citée comme origine d'une recette. L'arbre se construit avec les
          liens : « fils / fille de » pour les branches vers le bas, « conjoint·e de » pour les
          couples côte à côte.
        </p>
        {treeMembers.length === 0 ? (
          <EmptyState handText="L'arbre n'a pas encore de branches. Accroche ta première personne.">
            <Button size="lg" onClick={handleOpenCreateModal}>
              <Plus size={20} aria-hidden="true" /> Planter l'arbre
            </Button>
          </EmptyState>
        ) : (
          <div className="card-surface p-5 bg-sauge/5">
            <FamilyTree
              members={treeMembers}
              connectedProfileIds={connectedProfileIds}
              onEditMember={handleEditTreeMember}
              onRemoveMember={handleRemoveTreeMember}
            />
          </div>
        )}
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
            <div className="mt-4 rounded-2xl border-2 border-dashed border-sauge bg-sauge/10 p-4">
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
                    aria-label={`Annuler l’invitation de ${invitation.email}`}
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
        <Link to="/profil" className="text-terra font-bold hover:underline">
          Gérer mon profil
        </Link>
      </p>

      <FamilyMemberModal
        open={memberModalOpen}
        onClose={() => {
          setMemberModalOpen(false)
          setEditingMember(null)
        }}
        member={editingMember}
        generations={generations}
        treeMembers={treeMembers}
        onCreate={addTreeMember}
        onUpdate={editTreeMember}
      />
    </div>
  )
}
