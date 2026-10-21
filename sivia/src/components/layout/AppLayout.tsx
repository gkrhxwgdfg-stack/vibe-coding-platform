import type { ReactNode } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BookOpen, Heart, Home, Plus, Users, UserRound } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Accueil', icon: Home, end: true },
  { to: '/recettes', label: 'Recettes', icon: BookOpen, end: false },
  { to: '/favoris', label: 'Favoris', icon: Heart, end: true },
  { to: '/famille', label: 'Famille', icon: Users, end: true },
  { to: '/profil', label: 'Profil', icon: UserRound, end: true },
]

/**
 * Coque de l'application : en-tête maison + navigation basse fixe
 * (mobile-first, grandes cibles tactiles pour les aînés).
 */
export function AppLayout({ children }: { children?: ReactNode }) {
  const { family, profile } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh flex flex-col pb-24">
      <header className="sticky top-0 z-40 bg-lin/90 backdrop-blur border-b border-encre/10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Logo />
          <div className="text-right min-w-0">
            {family && (
              <p className="font-serif font-semibold text-encre truncate">{family.name}</p>
            )}
            {profile && (
              <p className="text-sm text-encre-soft truncate">Bonjour, {profile.display_name}</p>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-6">
        {children ?? <Outlet />}
      </main>

      {/* Bouton flottant « nouvelle recette » — action secondaire mais visible */}
      <button
        type="button"
        onClick={() => navigate('/recettes/nouvelle')}
        aria-label="Nouvelle recette"
        className="fixed bottom-22 right-5 z-40 w-14 h-14 rounded-full bg-terra text-creme shadow-soft flex items-center justify-center hover:bg-terra-dark active:scale-95 transition-colors"
      >
        <Plus size={28} strokeWidth={2.5} aria-hidden="true" />
      </button>

      <nav
        aria-label="Navigation principale"
        className="fixed bottom-0 inset-x-0 z-40 bg-creme/95 backdrop-blur border-t border-encre/10 safe-area-pb"
      >
        <ul className="max-w-3xl mx-auto flex items-stretch justify-around px-2">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center gap-0.5 min-h-16 py-1.5 text-xs font-bold transition-colors',
                    isActive ? 'text-terra' : 'text-encre-soft hover:text-encre',
                  )
                }
              >
                <Icon size={22} aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
