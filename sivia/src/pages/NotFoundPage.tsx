import { Link } from 'react-router-dom'
import { AuthShell } from '@/components/layout/AuthShell'
import { Button } from '@/components/ui/Button'

export function NotFoundPage() {
  return (
    <AuthShell title="Page perdue" handNote="Ratée, la page a débordé. On essuie et on recommence ?">
      <div className="text-center">
        <p className="font-serif text-6xl text-terra mb-4" aria-hidden="true">Savia</p>
        <p className="text-lg mb-6">Cette recette n’est pas dans le carnet.</p>
        <Link to="/">
          <Button size="lg">Retour en cuisine</Button>
        </Link>
      </div>
    </AuthShell>
  )
}
