import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Check, Copy, Mail, Trash2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useCreateInvitation, useFamilyMembers, useInvitations } from '@/hooks/useFamily'
import { supabase } from '@/lib/supabase'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { TextInput } from '@/components/ui/FormFields'
import { Spinner } from '@/components/ui/Spinner'
import { formatDate } from '@/lib/format'
import type { Invitation } from '@/lib/types'

export function FamilyPage() {
  const { profile, family } = useAuth()
  const { members, loading: membersLoading } = useFamilyMembers()
  const { invitations, loading: invitationsLoading, refetch } = useInvitations()
  const createInvitation = useCreateInvitation()

  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [lastLink, setLastLink] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

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
    setLastLink(`${window.location.origin}/invitation?token=${invitation.token}`)
    refetch()
  }

  async function cancelInvitation(invitation: Invitation) {
    await supabase.from('invitations').delete().eq('id', invitation.id)
    refetch()
  }

  async function copyLink(invitation: Invitation) {
    const link = `${window.location.origin}/invitation?token=${invitation.token}`
    await navigator.clipboard.writeText(link)
    setCopiedId(invitation.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (membersLoading || invitationsLoading) return <Spinner label="On rassemble la famille…" />

  return (
    <div className="space-y-8">
      <div>
        <p className="kicker">Le cercle</p>
        <h1 className="text-3xl font-bold mt-1">{family?.name ?? 'Ta famille'}</h1>
        <p className="text-hand text-bleu text-2xl mt-1">
          {members.length} membre{members.length > 1 ? 's' : ''} à table
        </p>
      </div>

      {/* Membres (badges/blasons) */}
      <section aria-labelledby="members-title">
        <CardHeader kicker="Les membres" title="À table" />
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
                  <p className="text-2xl" aria-hidden="true">{member.stamp_emoji}</p>
                  {member.bio && <p className="text-sm text-encre-soft truncate">{member.bio}</p>}
                  <p className="text-xs text-encre-soft">À table depuis {formatDate(member.created_at)}</p>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      {/* Inviter */}
      <section aria-labelledby="invite-title">
        <Card>
          <CardHeader kicker="Inviter" title="Ouvrir la porte à quelqu’un" />
          <form onSubmit={handleInvite} noValidate className="space-y-4">
            <TextInput
              label="L’email de ton invité"
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
    </div>
  )
}
