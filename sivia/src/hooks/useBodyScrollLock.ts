import { useEffect } from 'react'

/**
 * Masque la barre de défilement de la page tant qu'une modale est ouverte,
 * SANS verrouiller le défilement : la page reste libre derrière le flou,
 * on peut la faire glisser pour ajuster le cadrage soi-même.
 *
 * La barre de la page n'affleure donc plus au bord de la modale
 * (le défaut de « barre qui déborde »), et le contenu ne bouge pas :
 * la largeur de la barre est compensée par un padding. Les modales
 * gardent leur propre défilement interne (la barre du visuel reste).
 */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    const previousPadding = document.body.style.paddingRight
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }
    const style = document.createElement('style')
    style.textContent = 'html{scrollbar-width:none}html::-webkit-scrollbar{display:none}'
    document.head.appendChild(style)
    return () => {
      style.remove()
      document.body.style.paddingRight = previousPadding
    }
  }, [active])
}
