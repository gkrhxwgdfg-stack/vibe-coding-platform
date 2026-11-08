import { useNavigate, useSearchParams } from 'react-router-dom'
import { BookOpen, Check, Heart, TreePine, Users } from 'lucide-react'
import { AuthShell } from '@/components/layout/AuthShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { COPY } from '@/lib/copy'
import { useInvitationByToken } from '@/hooks/useFamily'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'

/**
 * Page publique d'invitation : /invitation?token=…
 * Accessible sans compte (le token fait foi), redirige vers l'inscription
 * si besoin, puis rattache l'utilisateur à la famille.
 *
 * Elle doit donner envie : la personne qui reçoit le lien dans un SMS ou une
 * conversation familiale doit comprendre en 5 secondes ce qui l'attend —
 * le carnet, l'arbre, les anecdotes — et rejoindre en un geste.
 */
export function InvitationPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? undefined
  const { invitation, loading, error } = useInvitationByToken(token)
  const { user, setFamilyId } = useAuth()
  const navigate = useNavigate()
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  async function accept() {
    if (!invitation) return
    setJoinError(null)
    setJoining(true)
    const { error: attachError } = await setFamilyId(invitation.family_id)
    if (attachError) {
      setJoinError(attachError)
      setJoining(false)
      return
    }
    await supabase.from('invitations').update({ status: 'accepted' }).eq('id', invitation.id)
    navigate('/', { replace: true })
  }

  if (loading) {
    return (
      <AuthShell title="Invitation">
        <Spinner label={COPY.loading.lien} />
      </AuthShell>
    )
  }

  if (error || !invitation) {
    return (
      <AuthShell title="Invitation" handNote="Ratée, la page a débordé. On essuie et on recommence ?">
        <Card className="text-center">
          <p className="text-lg mb-2">{error ?? 'Ce lien d’invitation n’est plus valide.'}</p>
          <p className="text-encre-doux mb-5">
            Demande un nouveau lien à ta famille, ou connecte-toi si tu as déjà un compte.
          </p>
          <div className="flex flex-col gap-3">
            <Button size="lg" onClick={() => navigate('/connexion')}>
              {COPY.nav.seConnecter}
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/inscription')}>
              {COPY.nav.sInscrire}
            </Button>
          </div>
        </Card>
      </AuthShell>
    )
  }

  const attente = [
    { icon: BookOpen, text: 'Les recettes de la famille, avec leurs anecdotes et leur histoire' },
    { icon: TreePine, text: 'L’arbre des générations — qui a transmis quoi, à qui' },
    { icon: Heart, text: 'Le carnet qui s’enrichit et se conserve, tous ensemble' },
  ]

  return (
    <AuthShell
      title="Tu es attendu à table"
      handNote="Quelqu’un de ta famille te tend une assiette."
    >
      <Card className="text-center">
        <Users size={36} className="mx-auto text-vert mb-3" aria-hidden="true" />
        <p className="kicker">La famille</p>
        <p className="font-serif text-3xl font-semibold mb-2">{invitation.family?.name}</p>
        <p className="text-encre-doux mb-6">
          t’ouvre la porte de sa cuisine.
        </p>

        <ul className="text-left space-y-3 mb-7 max-w-sm mx-auto">
          {attente.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center rounded-full bg-vert-clair text-vert shrink-0 w-9 h-9">
                <Icon size={18} aria-hidden="true" />
              </span>
              <span className="pt-1.5">{text}</span>
            </li>
          ))}
        </ul>

        {joinError && (
          <p className="text-tomate font-bold mb-4" role="alert">
            {joinError}
          </p>
        )}
        {user ? (
          <Button size="lg" className="w-full" onClick={accept} disabled={joining}>
            {joining ? 'On te réserve une place…' : (
              <>
                <Check size={20} aria-hidden="true" /> Rejoindre la famille
              </>
            )}
          </Button>
        ) : (
          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              className="w-full"
              onClick={() =>
                navigate(`/inscription?token=${invitation.token}`)
              }
            >
              Créer mon compte et rejoindre
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={() => navigate(`/connexion?token=${invitation.token}`)}
            >
              J’ai déjà un compte
            </Button>
          </div>
        )}
        <p className="text-sm text-encre-doux mt-5">
          30 secondes suffisent : un prénom, un mot de passe — et le carnet s’ouvre.
        </p>
      </Card>
    </AuthShell>
  )
}
