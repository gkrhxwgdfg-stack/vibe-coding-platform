import { APP_BUILD_MARKER } from '@/lib/constants'
import type { ReactNode } from 'react'
import { Logo } from '@/components/ui/Logo'

/** Écran d'authentification : logo, slogan, contenu centré */
export function AuthShell({ title, handNote, children }: { title: string; handNote?: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block mb-3">
            <Logo link={false} />
          </div>
          <p className="text-hand text-bleu-dark text-2xl">Le savoir qui se transmet en cuisine.</p>
          <span aria-hidden="true" className="sr-only">{APP_BUILD_MARKER}</span>
        </div>
        <div className="card-surface card-pad p-6 sm:p-8">
          <h1 className="text-3xl font-semibold mb-1">{title}</h1>
          {handNote && <p className="text-hand text-bleu-dark text-xl mb-5">{handNote}</p>}
          {children}
        </div>
      </div>
    </div>
  )
}
