import { Link } from 'react-router-dom'
import { AuthShell } from '@/components/layout/AuthShell'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { COPY } from '@/lib/copy'

export function NotFoundPage() {
  return (
    <AuthShell title="Page perdue" handNote="Ratée, la page a débordé. On essuie et on recommence ?">
      <EmptyState title="Cette page a dû sortir du four" handText={COPY.empty.recetteIntrouvable}>
        <Link to="/">
          <Button size="lg">{COPY.nav.retourCarnet}</Button>
        </Link>
      </EmptyState>
    </AuthShell>
  )
}
