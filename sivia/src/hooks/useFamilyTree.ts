import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  createFamilyEvent,
  createFamilyMember,
  deleteFamilyEvent,
  deleteFamilyMember,
  fetchFamilyEvents,
  fetchFamilyMembers,
} from '@/services/familyTree'
import type { FamilyEvent, FamilyMember } from '@/lib/types'

/** Membres « de l'arbre » de la famille (sans compte, ajoutés à la main) */
export function useFamilyTree() {
  const { profile } = useAuth()
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!profile?.family_id) {
      setMembers([])
      setLoading(false)
      return
    }
    setLoading(true)
    setMembers(await fetchFamilyMembers(profile.family_id))
    setLoading(false)
  }, [profile?.family_id])

  useEffect(() => {
    refetch()
  }, [refetch])

  const add = useCallback(
    async (values: Parameters<typeof createFamilyMember>[2]) => {
      if (!profile?.family_id || !profile.id) return { error: 'Non connecté', member: null }
      const result = await createFamilyMember(profile.family_id, profile.id, values)
      if (!result.error) await refetch()
      return result
    },
    [profile, refetch],
  )

  const remove = useCallback(
    async (memberId: string) => {
      const { error } = await deleteFamilyMember(memberId)
      if (!error) setMembers((prev) => prev.filter((m) => m.id !== memberId))
      return { error }
    },
    [],
  )

  return { members, loading, refetch, add, remove }
}

/** Événements de la famille (repas, anniversaires) avec leur menu */
export function useFamilyEvents() {
  const { profile } = useAuth()
  const [events, setEvents] = useState<FamilyEvent[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!profile?.family_id) {
      setEvents([])
      setLoading(false)
      return
    }
    setLoading(true)
    setEvents(await fetchFamilyEvents(profile.family_id))
    setLoading(false)
  }, [profile?.family_id])

  useEffect(() => {
    refetch()
  }, [refetch])

  const add = useCallback(
    async (values: Parameters<typeof createFamilyEvent>[2]) => {
      if (!profile?.family_id || !profile.id) return { error: 'Non connecté', event: null }
      const result = await createFamilyEvent(profile.family_id, profile.id, values)
      if (!result.error) await refetch()
      return result
    },
    [profile, refetch],
  )

  const remove = useCallback(
    async (eventId: string) => {
      const { error } = await deleteFamilyEvent(eventId)
      if (!error) setEvents((prev) => prev.filter((e) => e.id !== eventId))
      return { error }
    },
    [],
  )

  return { events, loading, refetch, add, remove }
}
