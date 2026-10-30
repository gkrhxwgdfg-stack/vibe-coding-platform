import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { planActif, type PlanInfo } from '@/lib/monetisation'

/**
 * Plan « Sivia Famille » du groupe : gratuit / essai / actif / expire.
 * L'état s'attache à la famille, pas à la personne — un seul paieur par groupe.
 */
export function useFamillePlan() {
  const { family } = useAuth()
  const [info, setInfo] = useState<PlanInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!family) {
      setInfo(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('families')
      .select('plan, plan_started_at, plan_expires_at, plan_source')
      .eq('id', family.id)
      .maybeSingle()
    setInfo((data as PlanInfo | null) ?? null)
    setLoading(false)
  }, [family?.id])

  useEffect(() => {
    refetch()
  }, [refetch])

  /** Ouvre l'essai d'un mois, sans carte bancaire (autorisé par le guard SQL : gratuit/expire → essai). */
  const activerEssai = useCallback(async (): Promise<{ error: string | null }> => {
    if (!family) return { error: 'Reconnecte-toi pour ouvrir l’essai.' }
    const { error } = await supabase
      .from('families')
      .update({ plan: 'essai' })
      .eq('id', family.id)
    if (error) return { error: 'L’essai n’a pas pu être ouvert. Réessaie dans un instant.' }
    await refetch()
    return { error: null }
  }, [family?.id, refetch])

  return {
    info,
    premium: planActif(info),
    /** Essai déjà utilisé par la famille (actif, expiré ou « expire ») — pas de second essai */
    dejaEssai: info?.plan === 'essai' || info?.plan === 'expire' || info?.plan === 'actif',
    loading,
    refetch,
    activerEssai,
  }
}
