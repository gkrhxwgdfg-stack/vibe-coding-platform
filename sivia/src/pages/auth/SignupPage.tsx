import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthShell } from '@/components/layout/AuthShell'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/FormFields'
import { useAuth } from '@/context/AuthContext'

export function SignupPage() {
  const { signUp, user, loading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inviteToken = searchParams.get('token')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 6) {
      setError('Ton mot de passe doit faire au moins 6 caractères.')
      return
    }
    if (password !== confirm) {
      setError('Les deux mots de passe ne sont pas identiques.')
      return
    }
    setSubmitting(true)
    const { error: signUpError } = await signUp(email, password, displayName.trim())
    setSubmitting(false)
    if (signUpError) {
      setError(signUpError)
      return
    }
    // La suite se passe dans l'onboarding : créer ou rejoindre une famille
    navigate(inviteToken ? `/bienvenue?token=${inviteToken}` : '/bienvenue', { replace: true })
  }

  return (
    <AuthShell title="S’inscrire" handNote="Bienvenue en cuisine. On commence par qui ?">
      <form onSubmit={handleSubmit} noValidate>
        <TextInput
          label="Ton prénom"
          htmlFor="displayName"
          autoComplete="given-name"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Jeanne"
          hint="C’est comme ça que la famille te verra."
        />
        <TextInput
          label="Ton adresse mail"
          htmlFor="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jeanne@famille.fr"
        />
        <TextInput
          label="Choisis un mot de passe"
          htmlFor="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <TextInput
          label="Retape le mot de passe"
          htmlFor="confirm"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {error && (
          <p className="text-tomate font-bold mb-4" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? 'On écrit ton nom…' : "S’inscrire"}
        </Button>
      </form>
      <p className="mt-6 text-center text-encre-doux">
        Déjà un compte ?{' '}
        <Link to="/connexion" className="text-tomate font-bold hover:underline">
          Se connecter
        </Link>
      </p>
    </AuthShell>
  )
}
