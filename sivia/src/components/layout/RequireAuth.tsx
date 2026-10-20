import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Spinner } from '@/components/ui/Spinner'

/**
 * Garde de route : redirige vers la connexion si non authentifié,
 * vers l'onboarding si connecté mais sans famille.
 */
export function RequireAuth() {
  const { user, loading, needsOnboarding } = useAuth()
  const location = useLocation()

  if (loading) {
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
