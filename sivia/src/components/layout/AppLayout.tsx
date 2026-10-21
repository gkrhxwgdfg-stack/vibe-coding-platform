import type { ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { BookOpen, Heart, Home, Users, UserRound } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { AddButtonHost } from '@/components/layout/AddButtonHost'
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

      {/* Bouton flottant « + » contextuel (accueil : photo planche, recettes : nouvelle
          recette, famille : membre de l'arbre ; absent sur favoris, profil, fiches) */}
      <AddButtonHost />

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
