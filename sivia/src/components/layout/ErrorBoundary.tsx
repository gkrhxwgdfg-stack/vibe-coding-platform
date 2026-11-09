import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * Filet de sécurité de l'application : si un écran casse (donnée
 * inattendue, réseau au mauvais moment), la famille ne voit jamais une
 * page blanche. Un mot doux, un bouton pour recharger, et le carnet
 * reste intact côté serveur.
 */
interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Sivia — écran cassé :', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-papier flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-4">
            <p className="font-serif text-3xl font-semibold">Un plat a débordé du four</p>
            <p className="text-lg text-encre-doux">
              Rien n’est perdu : le carnet de la famille est bien gardé.
              Recharge la page pour reprendre où tu en étais.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-full bg-tomate text-white font-bold px-6 py-3 min-h-11"
            >
              Recharger la page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
