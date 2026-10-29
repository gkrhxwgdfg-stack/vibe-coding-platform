/**
 * Trace d'ingrédient de la catégorie (§5.3–5.4, mapping §8) — pages
 * recette uniquement, une seule trace par page, jamais dans les listes.
 * Toujours sous le contenu : pointer-events none, opacités ≤ 12 % / ≤ 55 %.
 */
export function CategoryTrace({ category }: { category: string }) {
  if (category === 'plat') {
    return (
      <div className="trace-sauce absolute inset-0 pointer-events-none" aria-hidden="true" />
    )
  }
  if (category === 'dessert') {
    return (
      <div className="trace-caramel absolute inset-0 pointer-events-none" aria-hidden="true" />
    )
  }
  if (category === 'entree') {
    return (
      <svg
        width="90"
        viewBox="0 0 120 140"
        fill="none"
        stroke="#52755A"
        strokeWidth="2"
        strokeLinecap="round"
        className="absolute bottom-2 right-2 pointer-events-none opacity-55"
        aria-hidden="true"
      >
        <path d="M22 132 C50 104 62 74 92 44" />
        <path d="M46 106 q-3-14 9-20 q2 13-9 20z" fill="#52755A" fillOpacity=".45" stroke="none" />
        <path d="M60 88 q-1-15 12-20 q2 14-12 20z" fill="#52755A" fillOpacity=".45" stroke="none" />
        <path d="M74 68 q2-15 15-18 q0 14-15 18z" fill="#52755A" fillOpacity=".45" stroke="none" />
        <path d="M10 120 C34 98 44 76 66 58" strokeOpacity=".6" />
      </svg>
    )
  }
  if (category === 'fete') {
    return (
      <svg
        width="110"
        viewBox="0 0 120 120"
        className="absolute bottom-2 left-2 pointer-events-none"
        aria-hidden="true"
      >
        <g fill="#8A5A2B" fillOpacity=".55">
          <rect x="14" y="52" width="9" height="52" rx="4.5" transform="rotate(-24 18 78)" />
          <rect x="44" y="40" width="9" height="58" rx="4.5" transform="rotate(-12 48 69)" />
          <rect x="74" y="50" width="9" height="46" rx="4.5" transform="rotate(-32 78 73)" />
        </g>
        <g fill="#C93A2B" fillOpacity=".25">
          <circle cx="30" cy="34" r="3" />
          <circle cx="58" cy="22" r="2.2" />
          <circle cx="86" cy="30" r="3.4" />
          <circle cx="104" cy="52" r="2" />
          <circle cx="18" cy="24" r="2" />
        </g>
      </svg>
    )
  }
  return null
}
