import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { WheatIcon } from '@/components/motifs/WheatIcon'

interface LogoProps {
  className?: string
  /** Avec ou sans lien vers l'accueil */
  link?: boolean
}

/** La cuillère-monogramme : le premier outil transmis */
export function Logo({ className, link = true }: LogoProps) {
  const mark = (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <WheatIcon size={32} className="text-vert" />
      <span className="font-serif font-semibold text-2xl text-encre">
        Savia<span className="text-tomate">.</span>
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
