import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Logo } from '@/components/ui/Logo'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

/**
 * Filet de sécurité global : si un écran plante (donnée manquante, réseau…),
 * on affiche un message chaleureux au lieu d'une page blanche.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Savia] Erreur interceptée:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh flex flex-col items-center justify-center px-5 py-10">
          <div className="w-full max-w-md text-center">
            <div className="inline-block mb-4">
              <Logo link={false} />
            </div>
            <Card className="py-8">
              <p className="font-serif text-4xl text-terra mb-3" aria-hidden="true">Savia</p>
              <h1 className="font-serif text-2xl font-semibold mb-2">Ratée, la page a débordé.</h1>
              <p className="text-encre-soft mb-2">On essuie et on recommence ?</p>
              {this.state.message && (
                <p className="text-sm text-carmine font-mono bg-lin rounded-lg px-3 py-2 mb-4 break-all">
                  {this.state.message}
                </p>
              )}
              <Button size="lg" onClick={() => window.location.assign('/')}>
                Retour à table
              </Button>
            </Card>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
