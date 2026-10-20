import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '@/components/layout/AuthShell'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/FormFields'
import { useAuth } from '@/context/AuthContext'

export function ResetPasswordPage() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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
    const { error: updateError } = await updatePassword(password)
    setSubmitting(false)
    if (updateError) {
      setError('Le lien a peut-être expiré. Demande un nouveau lien.')
      return
    }
    setDone(true)
    setTimeout(() => navigate('/', { replace: true }), 2500)
  }

  return (
    <AuthShell title="Nouveau mot de passe" handNote="Un secret bien gardé, entre nous.">
      {done ? (
        <p className="text-center text-lg">C’est noté ! On retourne à table…</p>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <TextInput
            label="Nouveau mot de passe"
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
            <p className="text-carmine font-bold mb-4" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? 'On scelle le nouveau mot de passe…' : 'Changer le mot de passe'}
          </Button>
        </form>
      )}
      <p className="mt-6 text-center">
        <Link to="/connexion" className="text-bleu font-bold hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </AuthShell>
  )
}
