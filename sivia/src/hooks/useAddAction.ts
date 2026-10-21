import { useLocation } from 'react-router-dom'
import { addActionForPath, type AddAction } from '@/lib/addAction'

/**
 * Hook du bouton « + » contextuel : délègue le choix de l'action à
 * `addActionForPath` (logique testable, hors du composant).
 */
export function useAddAction(openPlancheModal: () => void): AddAction | null {
  const { pathname } = useLocation()
  return addActionForPath(pathname, openPlancheModal)
}
