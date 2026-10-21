import { useEffect, useState } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { AuthShell } from '@/components/layout/AuthShell'
import { Card } from '@/components/ui/Card'

interface CheckResult {
  name: string
  status: 'pending' | 'ok' | 'error'
  detail?: string
}

/**
 * Page de diagnostic : vérifie en temps réel que toute la chaîne fonctionne.
 * Accessible publiquement à /diagnostic — utile pour le support.
 */
export function DiagnosticPage() {
  const [checks, setChecks] = useState<CheckResult[]>([
    { name: 'Connexion Supabase', status: 'pending' },
    { name: 'Table families', status: 'pending' },
    { name: 'Table profiles', status: 'pending' },
    { name: 'Table recipes', status: 'pending' },
    { name: 'Table invitations', status: 'pending' },
    { name: 'Table favorites', status: 'pending' },
    { name: 'Bucket recipe-photos', status: 'pending' },
    { name: 'Inscription test', status: 'pending' },
    { name: 'Création famille', status: 'pending' },
    { name: 'Création recette', status: 'pending' },
    { name: 'Ajout favori', status: 'pending' },
  ])

  function update(index: number, status: CheckResult['status'], detail?: string) {
    setChecks((prev) => prev.map((c, i) => (i === index ? { ...c, status, detail } : c)))
  }

  useEffect(() => {
    async function run() {
      // 1. Connexion Supabase
      try {
        const { error } = await supabase.from('families').select('id').limit(1)
        update(0, error ? 'error' : 'ok', error?.message)
      } catch (e) {
        update(0, 'error', String(e))
      }

      // 2-6. Tables
      const tables = ['families', 'profiles', 'recipes', 'invitations', 'favorites'] as const
      for (let i = 0; i < tables.length; i++) {
        const { error } = await supabase.from(tables[i]).select('*').limit(1)
        update(i + 1, error ? 'error' : 'ok', error?.message)
      }

      // 7. Bucket storage
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
      const hasBucket = (buckets ?? []).some((b) => b.id === 'recipe-photos')
      update(6, bucketError || !hasBucket ? 'error' : 'ok',
        bucketError?.message ?? (hasBucket ? 'OK' : `Buckets: ${(buckets ?? []).map((b) => b.id).join(', ') || 'aucun'}`))

      // 8-11. Test end-to-end avec un compte jetable
      const testEmail = `diag-${Date.now()}@savia-diag.fr`
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: testEmail,
        password: 'DiagSavia2026!',
        options: { data: { display_name: 'Diagnostic' } },
      })
      if (signupError || !signupData.session) {
        update(7, 'error', signupError?.message ?? 'Pas de session (confirmation email ?)')
        for (let i = 8; i <= 10; i++) update(i, 'error', 'Signup échoué')
        return
      }
      update(7, 'ok', `Compte créé: ${signupData.user?.id?.substring(0, 8)}...`)

      const userId = signupData.user!.id

      // 9. Créer une famille
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert({ name: 'Famille Diagnostic', created_by: userId })
        .select()
        .single()
      if (familyError || !family) {
        update(8, 'error', familyError?.message ?? 'Échec')
        update(9, 'error', 'Pas de famille')
        update(10, 'error', 'Pas de famille')
        return
      }
      update(8, 'ok', `Famille créée: ${family.id.substring(0, 8)}...`)

      // Rattacher le profil
      await supabase.from('profiles').update({ family_id: family.id }).eq('id', userId)

      // 10. Créer une recette
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          family_id: family.id,
          author_id: userId,
          title: 'Recette diagnostic',
          category: 'autre',
          servings: 2,
          ingredients: ['test'],
          steps: ['test'],
        })
        .select()
        .single()
      if (recipeError || !recipe) {
        update(9, 'error', recipeError?.message ?? 'Échec')
        update(10, 'error', 'Pas de recette')
        return
      }
      update(9, 'ok', `Recette créée: ${recipe.id.substring(0, 8)}...`)

      // 11. Ajouter aux favoris
      const { error: favError } = await supabase
        .from('favorites')
        .insert({ user_id: userId, recipe_id: recipe.id })
      update(10, favError ? 'error' : 'ok', favError?.message ?? 'OK')

      // Nettoyage : supprimer le compte de test
      await supabase.auth.signOut()
    }

    run()
  }, [])

  const allOk = checks.every((c) => c.status === 'ok')
  const anyError = checks.some((c) => c.status === 'error')

  return (
    <AuthShell title="Diagnostic Savia" handNote="On vérifie que tout est bien branché.">
      <Card>
        <ul className="space-y-3">
          {checks.map((check) => (
            <li key={check.name} className="flex items-start gap-3">
              {check.status === 'pending' && <Loader2 size={20} className="text-encre-soft animate-spin shrink-0 mt-0.5" aria-hidden="true" />}
              {check.status === 'ok' && <Check size={20} className="text-sauge shrink-0 mt-0.5" aria-hidden="true" />}
              {check.status === 'error' && <X size={20} className="text-carmine shrink-0 mt-0.5" aria-hidden="true" />}
              <div className="min-w-0">
                <p className={`font-semibold ${check.status === 'error' ? 'text-carmine' : ''}`}>{check.name}</p>
                {check.detail && (
                  <p className="text-sm text-encre-soft break-all">{check.detail}</p>
                )}
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-6 pt-4 border-t border-encre/10">
          {allOk && <p className="text-sauge font-bold text-center">Tout fonctionne ! L’application est prête.</p>}
          {anyError && <p className="text-carmine font-bold text-center">Des problèmes ont été détectés. Voir les détails ci-dessus.</p>}
          {!allOk && !anyError && <p className="text-encre-soft text-center">Vérification en cours…</p>}
        </div>
      </Card>
    </AuthShell>
  )
}
