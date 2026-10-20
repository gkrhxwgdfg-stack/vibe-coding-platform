import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { RequireAuth } from '@/components/layout/RequireAuth'
import { Spinner } from '@/components/ui/Spinner'

// Chargement différé par page : le premier écran reste léger (mobile-first)
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })))
const SignupPage = lazy(() => import('@/pages/auth/SignupPage').then((m) => ({ default: m.SignupPage })))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })))
const OnboardingPage = lazy(() => import('@/pages/auth/OnboardingPage').then((m) => ({ default: m.OnboardingPage })))
const InvitationPage = lazy(() => import('@/pages/InvitationPage').then((m) => ({ default: m.InvitationPage })))
const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })))
const RecipesPage = lazy(() => import('@/pages/RecipesPage').then((m) => ({ default: m.RecipesPage })))
const RecipeDetailPage = lazy(() => import('@/pages/RecipeDetailPage').then((m) => ({ default: m.RecipeDetailPage })))
const RecipeFormPage = lazy(() => import('@/pages/RecipeFormPage').then((m) => ({ default: m.RecipeFormPage })))
const FavoritesPage = lazy(() => import('@/pages/FavoritesPage').then((m) => ({ default: m.FavoritesPage })))
const FamilyPage = lazy(() => import('@/pages/FamilyPage').then((m) => ({ default: m.FamilyPage })))
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))
const DiagnosticPage = lazy(() => import('@/pages/DiagnosticPage').then((m) => ({ default: m.DiagnosticPage })))

function PageLoader() {
  return <Spinner label="On charge la page…" />
}

export function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Zone publique */}
        <Route path="/connexion" element={<LoginPage />} />
        <Route path="/inscription" element={<SignupPage />} />
        <Route path="/mot-de-passe-oublie" element={<ForgotPasswordPage />} />
        <Route path="/reinitialiser-mot-de-passe" element={<ResetPasswordPage />} />
        <Route path="/invitation" element={<InvitationPage />} />
        <Route path="/diagnostic" element={<DiagnosticPage />} />

        {/* Zone authentifiée, avec coque maison */}
        <Route element={<RequireAuth />}>
          <Route path="/bienvenue" element={<OnboardingPage />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/recettes" element={<RecipesPage />} />
            <Route path="/recettes/nouvelle" element={<RecipeFormPage />} />
            <Route path="/recettes/:id" element={<RecipeDetailPage />} />
            <Route path="/recettes/:id/modifier" element={<RecipeFormPage />} />
            <Route path="/favoris" element={<FavoritesPage />} />
            <Route path="/famille" element={<FamilyPage />} />
            <Route path="/profil" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  )
}
