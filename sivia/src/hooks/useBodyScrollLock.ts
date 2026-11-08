import { useEffect } from 'react'

/**
 * Verrouille le défilement de la page tant qu'une modale est ouverte.
 *
 * Sans verrou, la page derrière continue de scroller : sa barre de
 * défilement affleure au bord de la modale (l'impression d'une « barre qui
 * déborde »), et la position de lecture dérive pendant puis après la
 * modale. Ici : plus de barre au bord, et la page se rouvre exactement où
 * elle était. La largeur de la barre est compensée pour éviter tout
 * saut de mise en page.
 */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    const previousOverflow = document.body.style.overflow
    const previousPadding = document.body.style.paddingRight
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
      document.body.style.paddingRight = previousPadding
    }
  }, [active])
}
