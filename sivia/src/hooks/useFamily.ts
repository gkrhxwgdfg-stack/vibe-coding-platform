import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { Invitation, Profile } from '@/lib/types'
import { COPY, friendlyError } from '@/lib/copy'

/** Membres de la famille (profils) */
export function useFamilyMembers() {
  const { profile } = useAuth()
  const [members, setMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMembers = useCallback(async () => {
    if (!profile?.family_id) {
      setMembers([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('family_id', profile.family_id)
      .order('display_name')
    setMembers((data ?? []) as Profile[])
    setLoading(false)
  }, [profile?.family_id])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  return { members, loading, refetch: fetchMembers }
}

/** Invitations en attente de la famille */
export function useInvitations() {
  const { profile } = useAuth()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)

  const fetchInvitations = useCallback(async () => {
    if (!profile?.family_id) {
      setInvitations([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('invitations')
      .select('*')
      .eq('family_id', profile.family_id)
      .order('created_at', { ascending: false })
    setInvitations((data ?? []) as Invitation[])
    setLoading(false)
  }, [profile?.family_id])

  useEffect(() => {
    fetchInvitations()
  }, [fetchInvitations])

  return { invitations, loading, refetch: fetchInvitations }
}

/** Crée une invitation et renvoie son lien */
export function useCreateInvitation() {
  const { profile } = useAuth()
  return useCallback(
    async (email: string) => {
      if (!profile?.family_id) return { error: COPY.errors.generique, invitation: null as Invitation | null }
      const { data, error } = await supabase
        .from('invitations')
        .insert({ family_id: profile.family_id, email, invited_by: profile.id })
        .select()
        .single()
      if (error || !data) return { error: error ? friendlyError(error.message) : COPY.errors.generique, invitation: null }
      return { error: null, invitation: data as Invitation }
    },
    [profile],
  )
}

/** Charge une invitation par son token (page publique /invitation?token=...) */
export function useInvitationByToken(token: string | undefined) {
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchInvitation() {
      if (!token) {
        setLoading(false)
        return
      }
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('invitations')
        .select('*, family:families(id, name)')
        .eq('token', token)
        .maybeSingle()

      if (fetchError || !data) {
        setError('Ce lien d’invitation n’est plus valide. Demande un nouveau lien à ta famille.')
        setInvitation(null)
      } else if (data.status !== 'pending' || new Date(data.expires_at) < new Date()) {
        setError('Cette invitation a déjà été utilisée ou a expiré.')
        setInvitation(null)
      } else {
        setInvitation(data as Invitation)
      }
      setLoading(false)
    }
    fetchInvitation()
  }, [token])

  return { invitation, loading, error }
}
