import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, Copy, Users } from 'lucide-react'
import { AuthShell } from '@/components/layout/AuthShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { TextInput } from '@/components/ui/FormFields'
import { ReadingSizePicker } from '@/components/ui/ReadingSizePicker'
import { supabase } from '@/lib/supabase'
import { invitationLink } from '@/lib/paths'
import { useAuth } from '@/context/AuthContext'

/**
 * Onboarding : créer sa famille (le créateur devient membre) ou en rejoindre
 * une via un code d'invitation reçu (coller le lien ou le code).
 */
export function OnboardingPage() {
  const { profile, user, setFamilyId, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [mode, setMode] = useState<'choix' | 'creer' | 'rejoindre' | 'lien'>('choix')
  const [familyName, setFamilyName] = useState('')
  const [familyRole, setFamilyRole] = useState('')
  const [inviteCode, setInviteCode] = useState(searchParams.get('token') ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  /** Lien d'invitation fraîchement généré après création de la famille */
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  if (!user) return null
  const userEmail = user.email ?? ''

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!profile) return
    setError(null)
    setSubmitting(true)

    // 1. Créer la famille
    const { data: family, error: familyError } = await supabase
      .from('families')
      .insert({ name: familyName.trim(), created_by: profile.id })
      .select()
      .single()

    if (familyError || !family) {
      setError('La famille n’a pas pu être créée. La sauce a raté. On recommence ?')
      setSubmitting(false)
      return
    }

    // 2. Rattacher le profil à cette famille (avec le lien familial si renseigné)
    const { error: attachError } = await setFamilyId(family.id)
    if (!attachError && familyRole.trim()) {
      await supabase
        .from('profiles')
        .update({ family_role: familyRole.trim() })
        .eq('id', profile.id)
    }
    if (attachError) {
      setError(attachError)
      setSubmitting(false)
      return
    }

    // 3. Générer une invitation pour partager le lien tout de suite
    const { data: invitation } = await supabase
      .from('invitations')
      .insert({ family_id: family.id, email: userEmail, invited_by: profile.id })
      .select()
      .single()

    await refreshProfile()
    setSubmitting(false)

    if (invitation) {
      setInviteLink(invitationLink(invitation.token))
      setMode('lien')
    } else {
      navigate('/', { replace: true })
    }
  }

  async function handleJoin(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    // Le code peut être le token seul ou l'URL complète
    const token = inviteCode.trim().split('token=')[1]?.split('&')[0] ?? inviteCode.trim()

    const { data: invitation, error: fetchError } = await supabase
      .from('invitations')
      .select('*, family:families(id, name)')
      .eq('token', token)
      .maybeSingle()

    if (fetchError || !invitation || invitation.status !== 'pending' || new Date(invitation.expires_at) < new Date()) {
      setError('Ce lien d’invitation n’est pas valide ou a expiré. Demande un nouveau lien à ta famille.')
      setSubmitting(false)
      return
    }

    const { error: attachError } = await setFamilyId(invitation.family_id)
    if (attachError) {
      setError(attachError)
      setSubmitting(false)
      return
    }

    await supabase.from('invitations').update({ status: 'accepted' }).eq('id', invitation.id)
    setSubmitting(false)
    navigate('/', { replace: true })
  }

  async function copyLink() {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (mode === 'creer') {
    return (
      <AuthShell title="Créer ta famille" handNote="Ta cuisine, ton carnet, tes recettes.">
        <form onSubmit={handleCreate} noValidate>
          <TextInput
            label="Le nom de ta famille"
            htmlFor="familyName"
            required
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            placeholder="La famille Dupont"
            hint="Tu pourras inviter ceux que tu aimes ensuite."
          />
          <TextInput
            label="Ton lien dans la famille"
            htmlFor="familyRole"
            value={familyRole}
            onChange={(e) => setFamilyRole(e.target.value)}
            placeholder="maman, papi, cousin…"
            hint="Comment les tiens t’appellent en cuisine ? Les autres pourront le préciser dans leur profil."
          />
          {error && <p className="text-carmine font-bold mb-4" role="alert">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={submitting || !familyName.trim()}>
            {submitting ? 'On installe la cuisine…' : 'Créer ma famille'}
          </Button>
          <button
            type="button"
            onClick={() => setMode('choix')}
            className="mt-4 w-full text-bleu-dark font-bold hover:underline min-h-11"
          >
            Retour
          </button>
        </form>
      </AuthShell>
    )
  }

  if (mode === 'rejoindre') {
    return (
      <AuthShell title="Rejoindre une famille" handNote="Colle le lien reçu, on t’ouvre la porte.">
        <form onSubmit={handleJoin} noValidate>
          <TextInput
            label="Lien ou code d’invitation"
            htmlFor="inviteCode"
            required
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="https://…/invitation?token=…"
          />
          {error && <p className="text-carmine font-bold mb-4" role="alert">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={submitting || !inviteCode.trim()}>
            {submitting ? 'On vérifie le lien…' : 'Rejoindre la famille'}
          </Button>
          <button
            type="button"
            onClick={() => setMode('choix')}
            className="mt-4 w-full text-bleu-dark font-bold hover:underline min-h-11"
          >
            Retour
          </button>
        </form>
      </AuthShell>
    )
  }

  if (mode === 'lien' && inviteLink) {
    return (
      <AuthShell title="Ta famille est prête !" handNote="Passe la recette — comme une assiette, tendue.">
        <Card className="text-center">
          <Users size={40} className="mx-auto text-terra-dark mb-3" aria-hidden="true" />
          <p className="mb-4">
            Voici le <strong>lien d’invitation</strong> de ta famille. Envoie-le à ceux que tu
            veux réunir en cuisine — grands-parents, cousins, enfants.
          </p>
          <div className="flex gap-2 mb-4">
            <input
              readOnly
              value={inviteLink}
              aria-label="Lien d’invitation"
              className="flex-1 min-h-11 rounded-xl border-2 border-encre/20 bg-lin px-3 text-sm"
              onFocus={(e) => e.target.select()}
            />
            <Button onClick={copyLink} variant="outline" aria-label="Copier le lien">
              {copied ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
            </Button>
          </div>
          <p className="text-sm text-encre-soft mb-5">
            Tu retrouveras ce lien plus tard, dans l’onglet <strong>Famille</strong>.
          </p>
          <Button size="lg" className="w-full" onClick={() => navigate('/', { replace: true })}>
            Aller à mes recettes
          </Button>
        </Card>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Bienvenue en cuisine." handNote="On commence par qui ?">
      {/* Chantier 8 : le réglage de taille du texte est proposé d\u00e8s le premier \u00e9cran */}
      <div className="mb-6">
        <ReadingSizePicker hint="Tu pourras le changer plus tard, dans ton profil." />
      </div>
      <div className="grid gap-4">
        <button
          type="button"
          onClick={() => setMode('creer')}
          className="card-surface card-pad p-5 text-left hover:shadow-soft transition-shadow w-full"
        >
          <span className="font-serif font-semibold text-xl block">Créer ma famille</span>
          <span className="text-encre-soft">J’aménage la cuisine et j’invite les miens.</span>
        </button>
        <button
          type="button"
          onClick={() => setMode('rejoindre')}
          className="card-surface card-pad p-5 text-left hover:shadow-soft transition-shadow w-full"
        >
          <span className="font-serif font-semibold text-xl block">Rejoindre ma famille</span>
          <span className="text-encre-soft">J’ai reçu un lien d’invitation.</span>
        </button>
      </div>
    </AuthShell>
  )
}
