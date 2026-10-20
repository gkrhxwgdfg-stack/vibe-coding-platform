import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { appUrl } from '@/lib/paths'
import type { Family, Profile } from '@/lib/types'

interface AuthContextValue {
  user: User | null
  session: Session | null
  profile: Profile | null
  family: Family | null
  /** true tant que la session + le profil ne sont pas chargés */
  loading: boolean
  /** true si l'utilisateur est connecté mais n'a pas encore de famille */
  needsOnboarding: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  updatePassword: (password: string) => Promise<{ error: string | null }>
  refreshProfile: () => Promise<void>
  /** Appelé après création de famille ou acceptation d'invitation */
  setFamilyId: (familyId: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function errorMessage(error: { message: string } | null): string | null {
  return error ? error.message : null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [family, setFamily] = useState<Family | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId: string) => {
    let { data: profileRow } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    // Filet de sécurité : si le profil n'existe pas (compte créé avant le schéma,
    // trigger en panne, etc.), on le recrée à la volée au lieu de planter.
    // On tente d'abord un INSERT (policy profiles_insert_self), et si la ligne
    // existe déjà (profil créé par le trigger entre-temps), on fait un UPDATE.
    if (!profileRow) {
      const { data: userData } = await supabase.auth.getUser()
      const displayName =
        (userData.user?.user_metadata as { display_name?: string } | undefined)?.display_name ??
        (userData.user?.email?.split('@')[0] ?? 'Nouveau membre')
      const { data: inserted, error: insertError } = await supabase
        .from('profiles')
        .insert({ id: userId, display_name: displayName })
        .select()
        .single()
      if (insertError) {
        // Le profil a été créé entre-temps (trigger) : on le met à jour à la place
        const { data: updated } = await supabase
          .from('profiles')
          .update({ display_name: displayName })
          .eq('id', userId)
          .select()
          .single()
        profileRow = updated
      } else {
        profileRow = inserted
      }
    }

    const nextProfile = (profileRow ?? null) as Profile | null
    setProfile(nextProfile)

    if (nextProfile?.family_id) {
      const { data: familyRow } = await supabase
        .from('families')
        .select('*')
        .eq('id', nextProfile.family_id)
        .maybeSingle()
      setFamily((familyRow ?? null) as Family | null)
    } else {
      setFamily(null)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    // Sécurité absolue : quoi qu'il arrive, l'UI ne bloque jamais plus de 8s
    const safetyTimeout = setTimeout(() => {
      if (mounted) setLoading(false)
    }, 8000)

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      if (data.session?.user) {
        loadProfile(data.session.user.id)
          .catch(() => { /* le self-healing gère le profil manquant */ })
          .finally(() => {
            if (mounted) {
              clearTimeout(safetyTimeout)
              setLoading(false)
            }
          })
      } else {
        setProfile(null)
        setFamily(null)
        clearTimeout(safetyTimeout)
        setLoading(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession?.user) {
        setLoading(true)
        loadProfile(newSession.user.id)
          .catch(() => { /* idem */ })
          .finally(() => {
            if (mounted) setLoading(false)
          })
      } else {
        setProfile(null)
        setFamily(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      clearTimeout(safetyTimeout)
      listener.subscription.unsubscribe()
    }
  }, [loadProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: errorMessage(error) }
  }, [])

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })
    return { error: errorMessage(error) }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setFamily(null)
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    const redirectTo = appUrl('/reinitialiser-mot-de-passe')
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    return { error: errorMessage(error) }
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    return { error: errorMessage(error) }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id)
  }, [session?.user, loadProfile])

  const setFamilyId = useCallback(
    async (familyId: string) => {
      if (!session?.user) return { error: 'Non connecté' }
      const { error } = await supabase
        .from('profiles')
        .update({ family_id: familyId })
        .eq('id', session.user.id)
      if (error) return { error: error.message }
      await loadProfile(session.user.id)
      return { error: null }
    },
    [session?.user, loadProfile],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      profile,
      family,
      loading,
      needsOnboarding: !loading && !!session?.user && !profile?.family_id,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
      refreshProfile,
      setFamilyId,
    }),
    [session, profile, family, loading, signIn, signUp, signOut, resetPassword, updatePassword, refreshProfile, setFamilyId],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans un <AuthProvider>')
  return ctx
}
