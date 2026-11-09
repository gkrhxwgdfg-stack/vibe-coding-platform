import { Flag } from 'lucide-react'
import { CONTACT_EMAIL } from '@/lib/constants'

interface SignalerButtonProps {
  /** Ce qui est signalé — apparaît dans l'objet du message (« le moment de Léon »). */
  label: string
  /** `icon` : bouton rond discret (fil de vie, planche) · `link` : petit lien texte (fiche, footer). */
  variant?: 'icon' | 'link'
  /** Classes complètes du bouton (adaptées au contexte d'accueil). */
  className?: string
}

/**
 * Signalement de contenu illicite (DSA, art. 16 — applicable à tout hébergeur,
 * sans seuil de taille). À cette échelle, un e-mail pré-rempli suffit : l'objet
 * et la page concernée sont déjà remplis, le destinataire est l'adresse de
 * contact (CONTACT_EMAIL, à compléter avant le lancement public).
 */
export function SignalerButton({ label, variant = 'icon', className }: SignalerButtonProps) {
  const subject = `Signalement sur Sivia — ${label}`
  const body = [
    'Bonjour,',
    '',
    `Je souhaite signaler ${label}.`,
    `Page concernée : ${window.location.href}`,
    'Motif :',
    '',
  ].join('\n')
  const href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

  if (variant === 'link') {
    return (
      <a
        href={href}
        className={className ?? 'text-encre-doux/70 hover:text-tomate hover:underline'}
      >
        <Flag size={13} className="inline -mt-0.5 mr-1" aria-hidden="true" />
        Signaler
      </a>
    )
  }

  return (
    <button
      type="button"
      aria-label={`Signaler ${label}`}
      title={`Signaler ${label}`}
      onClick={() => {
        window.location.href = href
      }}
      className={
        className ??
        'min-h-8 min-w-8 rounded-full bg-carte/85 shadow-sm inline-flex items-center justify-center text-encre-doux hover:text-tomate'
      }
    >
      <Flag size={14} aria-hidden="true" />
    </button>
  )
}
