import { type ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { scrollVersMilieu } from '@/lib/scroll'

interface PremiumGateProps {
  /** Titre de la section verrouillée (ex. « L'arbre généalogique vivant ») */
  title: string
  /** La promesse, en une phrase : ce que la famille gagne */
  description: string
  /** Ouvre le paywall « Sivia Famille » */
  openPaywall: () => void
  /** Aperçu en vitrine : la section réelle, floutée sous le voile */
  children?: ReactNode
}

/**
 * Voile premium — la vitrine de Sivia Famille.
 *
 * La section reste visible (floutée, non interactive) : la famille devine
 * la valeur avant de payer. Le voile parle fierté et promesse, jamais
 * culpabilisation, et l'ouverture du paywall reste à un clic.
 */
export function PremiumGate({ title, description, openPaywall, children }: PremiumGateProps) {
  return (
    <div className="relative">
      {children && (
        <div className="pointer-events-none select-none blur-[6px] opacity-60 saturate-50" aria-hidden="true">
          {children}
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl bg-carte border-2 border-vert/25 p-6 shadow-soft text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-vert-clair">
            <Lock size={22} className="text-vert" aria-hidden="true" />
          </div>
          <p className="kicker text-vert mb-1">Sivia Famille</p>
          <p className="font-serif text-xl text-encre mb-1.5">{title}</p>
          <p className="text-sm text-encre-doux leading-relaxed mb-4">{description}</p>
          <Button
            onClick={() => {
              // La page se place au MILIEU avant d'ouvrir le paywall :
              // les informations restent visibles derrière le flou.
              // Instantané : une animation serait coupée par la modale.
              scrollVersMilieu()
              openPaywall()
            }}
          >
            Découvrir Sivia Famille
          </Button>
        </div>
      </div>
    </div>
  )
}
