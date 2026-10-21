import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check } from 'lucide-react'
import { AuthShell } from '@/components/layout/AuthShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { useInvitationByToken } from '@/hooks/useFamily'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'

/**
 * Page publique d'invitation : /invitation?token=…
 * Accessible sans compte (le token fait foi), redirige vers l'inscription
 * si besoin, puis rattache l'utilisateur à la famille.
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
        <Spinner label="On vérifie le lien…" />
      </AuthShell>
    )
  }

  if (error || !invitation) {
    return (
      <AuthShell title="Invitation" handNote="Ratée, la page a débordé. On essuie et on recommence ?">
        <Card className="text-center">
          <p className="text-lg mb-2">{error ?? 'Invitation introuvable.'}</p>
          <p className="text-encre-soft mb-5">
            Demande un nouveau lien à ta famille, ou connecte-toi si tu as déjà un compte.
          </p>
          <div className="flex flex-col gap-3">
            <Button size="lg" onClick={() => navigate('/connexion')}>
              Se connecter
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/inscription')}>
              S'inscrire
            </Button>
          </div>
        </Card>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Tu es invité en cuisine !" handNote="Quelqu’un de ta famille te tend une assiette.">
      <Card className="text-center">
        <p className="text-lg mb-1">
          Rejoins la famille <strong className="font-serif">{invitation.family?.name}</strong>
        </p>
        <p className="text-encre-soft mb-6">
          Tu verras ses recettes, tu pourras en ajouter, et garder le secret de la sauce au chaud.
        </p>
        {joinError && (
          <p className="text-carmine font-bold mb-4" role="alert">
            {joinError}
          </p>
        )}
        {user ? (
          <Button size="lg" className="w-full" onClick={accept} disabled={joining}>
            {joining ? 'On te réserve une place…' : (
              <>
                <Check size={20} aria-hidden="true" /> Accepter l’invitation
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
      </Card>
    </AuthShell>
  )
}
