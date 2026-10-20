import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  /** Avec ou sans lien vers l'accueil */
  link?: boolean
}

/** La cuillère-monogramme : le premier outil transmis */
export function Logo({ className, link = true }: LogoProps) {
  const mark = (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg width="34" height="34" viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="54" fill="#C4643A" />
        <path
          d="M44 30c12-6 30-4 32 8 2 11-12 13-20 17-8 4-12 10-8 17 5 9 24 9 32 2"
          fill="none"
          stroke="#FBF6EC"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <ellipse cx="60" cy="88" rx="9" ry="6.5" fill="#FBF6EC" />
        <path
          d="M78 26c8-3 14 2 14 8 0 7-6 10-12 14"
          fill="none"
          stroke="#D9A441"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
      <span className="font-serif font-bold text-2xl text-encre">
        Savia<span className="text-terra">.</span>
      </span>
    </span>
  )

  return link ? (
    <Link to="/" aria-label="Savia — retour à l'accueil">
      {mark}
    </Link>
  ) : (
    mark
  )
}
