import { useCallback, useEffect, useState } from 'react'
import { fetchCooks, markCooked, unmarkCooked, type RecipeCookEntry } from '@/services/recipes'

/**
 * « Je l'ai faite ! » : la liste de ceux qui ont refait la recette,
 * et l'état de l'utilisateur courant (marqueur posé ou non).
 * La RLS limite déjà tout au cercle familial.
 */
export function useCooks(recipeId: string | undefined, currentUserId: string | undefined) {
  const [cooks, setCooks] = useState<RecipeCookEntry[]>([])
  const [busy, setBusy] = useState(false)
  const [mine, setMine] = useState<RecipeCookEntry | null>(null)

  const load = useCallback(
    async (silent = false) => {
      if (!recipeId) {
        setCooks([])
        setMine(null)
        return
      }
      if (!silent) setBusy(true)
      const rows = await fetchCooks(recipeId)
      setCooks(rows)
      setMine(rows.find((c) => c.user_id === currentUserId) ?? null)
      if (!silent) setBusy(false)
    },
    [recipeId, currentUserId],
  )

  useEffect(() => {
    let cancelled = false
    if (!recipeId) return
    fetchCooks(recipeId).then((rows) => {
      if (cancelled) return
      setCooks(rows)
      setMine(rows.find((c) => c.user_id === currentUserId) ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [recipeId, currentUserId])

  /** « Je l'ai faite ! » — pose (ou repose) le marqueur de l'utilisateur courant */
  async function mark() {
    if (!recipeId || !currentUserId || busy) return
    setBusy(true)
    const { error } = await markCooked(recipeId, currentUserId)
    if (!error) await load(true)
    setBusy(false)
  }

  /** Retire son marqueur */
  async function unmark() {
    if (!recipeId || !currentUserId || busy) return
    setBusy(true)
    const { error } = await unmarkCooked(recipeId, currentUserId)
    if (!error) await load(true)
    setBusy(false)
  }

  return { cooks, mine, busy, mark, unmark, reload: load }
}
