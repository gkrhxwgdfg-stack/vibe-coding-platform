import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Spinner } from '@/components/ui/Spinner'

/**
 * Garde de route : redirige vers la connexion si non authentifié,
 * vers l'onboarding si connecté mais sans famille.
 */
export function RequireAuth() {
  const { user, loading, needsOnboarding, profile } = useAuth()
  const location = useLocation()

  // Tant que la session ET le profil ne sont pas chargés, on patiente :
  // évite le flash « page beige » quand le profil arrive après la session.
  if (loading || (user && !profile)) {
    return <Spinner label="On installe la table…" />
  }
  if (!user) {
    return <Navigate to="/connexion" state={{ from: location.pathname }} replace />
  }
  if (needsOnboarding && !location.pathname.startsWith('/invitation')) {
    return <Navigate to="/bienvenue" replace />
  }
  return <Outlet />
}
