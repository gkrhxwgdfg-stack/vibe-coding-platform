interface WheatIconProps {
  size?: number
  className?: string
}

/**
 * Épi de blé — l'icône Accueil (§4). Seul symbole patrimonial autorisé
 * à devenir une icône : trait moderne 1,6 px, currentColor, zéro ornement.
 */
export function WheatIcon({ size = 20, className }: WheatIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 22V8" />
      <ellipse cx="9.4" cy="9" rx="2" ry="4" transform="rotate(-38 9.4 9)" />
      <ellipse cx="14.6" cy="9" rx="2" ry="4" transform="rotate(38 14.6 9)" />
      <ellipse cx="9.4" cy="13" rx="2" ry="4" transform="rotate(-38 9.4 13)" />
      <ellipse cx="14.6" cy="13" rx="2" ry="4" transform="rotate(38 14.6 13)" />
      <ellipse cx="9.4" cy="17" rx="2" ry="4" transform="rotate(-38 9.4 17)" />
      <ellipse cx="14.6" cy="17" rx="2" ry="4" transform="rotate(38 14.6 17)" />
      <ellipse cx="12" cy="5.5" rx="1.8" ry="3.4" />
    </svg>
  )
}
