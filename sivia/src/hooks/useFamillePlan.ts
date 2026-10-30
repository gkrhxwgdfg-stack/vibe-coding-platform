import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { planActif, simulationPlan, type PlanInfo } from '@/lib/monetisation'

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

  // Mode aperçu (réglé dans le Profil) : force l'affichage d'une version,
  // sans toucher à l'abonnement réel. Recalculé à chaque rendu, donc un
  // changement pris dans le Profil s'applique dès la navigation suivante.
  const simulation = simulationPlan()
  const premiumReel = planActif(info)

  return {
    info,
    /** Accès aux fonctions de conservation (aperçu OU abonnement réel) */
    premium:
      simulation === 'premium' ? true : simulation === 'gratuit' ? false : premiumReel,
    /** État réel, sans l'aperçu — pour l'affichage dans le Profil */
    premiumReel,
    /** Réglage d'aperçu actif ('gratuit' | 'premium' | null) */
    simulation,
    /** Essai déjà utilisé par la famille (actif, expiré ou « expire ») — pas de second essai */
    dejaEssai: info?.plan === 'essai' || info?.plan === 'expire' || info?.plan === 'actif',
    loading,
    refetch,
    activerEssai,
  }
}
