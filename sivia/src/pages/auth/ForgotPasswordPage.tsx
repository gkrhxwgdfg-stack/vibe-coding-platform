import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthShell } from '@/components/layout/AuthShell'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/FormFields'
import { useAuth } from '@/context/AuthContext'

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error: resetError } = await resetPassword(email)
    setSubmitting(false)
    if (resetError) {
      setError('Impossible d’envoyer le mail pour le moment. Réessaie dans un instant.')
      return
    }
    setSent(true)
  }

  return (
    <AuthShell title="Mot de passe oublié" handNote="Ça arrive, même aux meilleurs.">
      {sent ? (
        <div className="text-center">
          <p className="text-lg mb-2">
            C’est envoyé !
          </p>
          <p className="text-encre-doux mb-6">
            Regarde ta boîte mail à l’adresse <strong>{email}</strong> et suis le lien pour choisir
            un nouveau mot de passe.
          </p>
          <Link to="/connexion" className="text-tomate font-bold hover:underline">
            Retour à la connexion
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <TextInput
            label="Ton adresse mail"
            htmlFor="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="papa@famille.fr"
            hint="On t’envoie un lien pour choisir un nouveau mot de passe."
          />
          {error && (
            <p className="text-tomate font-bold mb-4" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? 'On cherche dans la cuisine…' : 'Envoyer le lien'}
          </Button>
        </form>
      )}
      <p className="mt-6 text-center">
        <Link to="/connexion" className="text-vert font-bold hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </AuthShell>
  )
}
