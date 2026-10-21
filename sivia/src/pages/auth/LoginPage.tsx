import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthShell } from '@/components/layout/AuthShell'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/FormFields'
import { useAuth } from '@/context/AuthContext'

export function LoginPage() {
  const { signIn, user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const inviteToken = searchParams.get('token')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from ?? '/'} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error: signInError } = await signIn(email, password)
    setSubmitting(false)
    if (signInError) {
      setError('On ne reconnaît pas cette adresse ou ce mot de passe. Essaie encore ?')
      return
    }
    navigate(inviteToken ? `/bienvenue?token=${inviteToken}` : '/', { replace: true })
  }

  return (
    <AuthShell title="Se connecter" handNote="Content de te revoir en cuisine.">
      <form onSubmit={handleSubmit} noValidate>
        <TextInput
          label="Ton email"
          htmlFor="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="papa@famille.fr"
        />
        <TextInput
          label="Ton mot de passe"
          htmlFor="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && (
          <p className="text-carmine font-bold mb-4" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? 'On ouvre la porte…' : 'Entrer en cuisine'}
        </Button>
      </form>
      <div className="mt-6 text-center space-y-2">
        <p>
          <Link to="/mot-de-passe-oublie" className="text-bleu font-bold hover:underline">
            Mot de passe oublié ?
          </Link>
        </p>
        <p className="text-encre-soft">
          Pas encore de compte ?{' '}
          <Link to="/inscription" className="text-terra font-bold hover:underline">
            S'inscrire
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
