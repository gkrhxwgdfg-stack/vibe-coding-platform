import { useEffect, useState } from 'react'
import { Check, Gift, Lock, ShieldCheck, Sparkles, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import {
  PRIX,
  eur,
  marquerPaywallVu,
  prixParPersonne,
  rappelerDans6Mois,
} from '@/lib/monetisation'

type PaywallVue = 'choix' | 'essai-ok' | 'attente-ok'

interface PaywallModalProps {
  open: boolean
  onClose: () => void
  /** Le moment de fierté qui a ouvert le paywall (ex. « Imprimer la recette de mamie ») */
  contexte?: string
  /** Appelé quand l'essai vient d'être activé (la page déverrouille ses actions) */
  onEssaiActif?: () => void
  /** L'essai a déjà été utilisé par la famille : on ne le propose pas deux fois */
  dejaEssai?: boolean
}

/**
 * Paywall « Sivia Famille » — un seul plan au nom du groupe.
 *
 * Ton : fierté, jamais de culpabilisation ni d'urgence artificielle.
 * Fermeture toujours facile (X, Échap, clic sur le voile) ; aucune
 * sollicitation ne s'ouvre d'elle-même plus d'une fois par semaine.
 */
export function PaywallModal({ open, onClose, contexte, onEssaiActif, dejaEssai }: PaywallModalProps) {
  const { family, profile } = useAuth()
  const [vue, setVue] = useState<PaywallVue>('choix')
  const [duree, setDuree] = useState<'annuel' | 'mensuel'>('annuel')
  const [membres, setMembres] = useState(0)
  const [busy, setBusy] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  // Ouverture : trace anti-spam + remise à zéro (une seule fois par ouverture)
  useEffect(() => {
    if (!open) return
    marquerPaywallVu()
    setVue('choix')
    setErreur(null)
  }, [open])

  // Échap ferme le paywall — fermeture toujours facile
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Nombre de membres du groupe : le prix se raconte « par personne »
  useEffect(() => {
    if (!open || !family) return
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('family_id', family.id)
      .then(({ count }) => setMembres(count ?? 1))
  }, [open, family?.id])

  if (!open) return null

  async function ouvrirEssai() {
    if (!family || busy) return
    setBusy(true)
    setErreur(null)
    // Essai d'un mois, sans carte — le serveur fixe les dates (guard SQL)
    const { error } = await supabase.from('families').update({ plan: 'essai' }).eq('id', family.id)
    setBusy(false)
    if (error) {
      setErreur('L’essai n’a pas pu être ouvert. Réessaie dans un instant.')
      return
    }
    setVue('essai-ok')
    onEssaiActif?.()
  }

  async function rejoindreListe() {
    if (!family || !profile || busy) return
    setBusy(true)
    setErreur(null)
    // Une seule ligne par famille (contrainte unique) : on tente l'insertion ;
    // si la famille est déjà inscrite (doublon 23505), c'est un succès aussi.
    // On n'utilise PAS upsert/onConflict : sous RLS, l'upsert exige une policy
    // UPDATE sur family_waitlist et échoue sinon (42501).
    const { error } = await supabase
      .from('family_waitlist')
      .insert({ family_id: family.id, created_by: profile.id, note: contexte ?? null })
    setBusy(false)
    const dejaInscrit =
      !!error && (error.code === '23505' || error.message.includes('duplicate key'))
    if (error && !dejaInscrit) {
      setErreur('On n’a pas pu t’inscrire. Réessaie dans un instant.')
      return
    }
    setVue('attente-ok')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-encre/40 backdrop-blur-sm p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="paywall-title"
        className="bg-carte w-full max-w-md rounded-[20px] max-h-[90dvh] overflow-y-auto shadow-soft"
      >
        {vue === 'essai-ok' ? (
          <div className="p-6 sm:p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-vert-clair">
              <Sparkles size={26} className="text-vert" aria-hidden="true" />
            </div>
            <h2 id="paywall-title" className="font-serif text-2xl text-encre mb-2">
              Le coffre est ouvert pour un mois
            </h2>
            <p className="text-encre-doux leading-relaxed mb-6">
              Pendant l’essai, toute la famille imprime, télécharge et conserve sans
              filigrane. Aucune carte demandée — nous te préviendrons simplement
              avant la fin.
            </p>
            <Button size="lg" className="w-full" onClick={onClose}>
              Continuer
            </Button>
          </div>
        ) : vue === 'attente-ok' ? (
          <div className="p-6 sm:p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-vert-clair">
              <Check size={26} className="text-vert" aria-hidden="true" />
            </div>
            <h2 id="paywall-title" className="font-serif text-2xl text-encre mb-2">
              Votre famille est sur la liste
            </h2>
            <p className="text-encre-doux leading-relaxed mb-6">
              On vous préviendra dès l’ouverture des paiements — rien d’autre, aucune
              relance.
            </p>
            <Button variant="secondary" size="lg" className="w-full" onClick={onClose}>
              Continuer
            </Button>
          </div>
        ) : (
          <>
            {/* En-tête : fierté, pas d'urgence */}
            <div className="relative bg-vert text-white p-6 pb-5 rounded-t-[20px]">
              <button
                type="button"
                onClick={onClose}
                aria-label="Ranger"
                className="absolute top-3 right-3 min-h-11 min-w-11 rounded-full text-white/80 hover:text-white inline-flex items-center justify-center transition-colors"
              >
                <X size={20} aria-hidden="true" />
              </button>
              <p className="kicker text-white/75 mb-1">Sivia Famille</p>
              <h2 id="paywall-title" className="font-serif text-2xl leading-snug pr-10">
                Le carnet de votre famille mérite d’exister pour toujours
              </h2>
              {contexte && (
                <p className="text-white/85 italic mt-2 text-sm">{contexte}</p>
              )}
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              {/* Un seul plan, deux durées */}
              <div className="space-y-3" role="radiogroup" aria-label="Durée de l’abonnement familial">
                <button
                  type="button"
                  role="radio"
                  aria-checked={duree === 'annuel'}
                  onClick={() => setDuree('annuel')}
                  className={cn(
                    'w-full text-left rounded-2xl border-2 p-4 transition-colors',
                    duree === 'annuel'
                      ? 'border-vert bg-vert-clair/60'
                      : 'border-encre-doux/20 bg-papier hover:border-vert/60',
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-extrabold text-encre">Toute l’année</span>
                    <span className="text-xs font-extrabold uppercase tracking-wide text-vert bg-white rounded-full px-2.5 py-1 border border-vert/25">
                      −30 %
                    </span>
                  </div>
                  <div className="mt-1 text-2xl font-serif text-encre">
                    {eur(PRIX.annuel)}
                    <span className="text-sm text-encre-doux font-sans"> / an</span>
                  </div>
                  <p className="text-sm text-encre-doux mt-1">
                    ≈ {eur(PRIX.annuel / 12)} par mois ·{' '}
                    <Gift size={13} className="inline align-[-2px]" aria-hidden="true" />{' '}
                    chèque-livre de {eur(PRIX.chequeLivre)} offert
                  </p>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={duree === 'mensuel'}
                  onClick={() => setDuree('mensuel')}
                  className={cn(
                    'w-full text-left rounded-2xl border-2 p-4 transition-colors',
                    duree === 'mensuel'
                      ? 'border-vert bg-vert-clair/60'
                      : 'border-encre-doux/20 bg-papier hover:border-vert/60',
                  )}
                >
                  <span className="font-extrabold text-encre">Mois par mois</span>
                  <div className="mt-1 text-2xl font-serif text-encre">
                    {eur(PRIX.mensuel)}
                    <span className="text-sm text-encre-doux font-sans"> / mois</span>
                  </div>
                  <p className="text-sm text-encre-doux mt-1">Sans engagement, résiliable en 2 clics</p>
                </button>
              </div>

              {membres >= 2 && (
                <p className="text-center text-encre-doux text-sm">
                  Soit {prixParPersonne(membres)} par personne pour {membres} membres
                </p>
              )}

              {/* Signaux de confiance */}
              <ul className="space-y-2 text-sm text-encre-doux">
                <li className="flex items-start gap-2">
                  <ShieldCheck size={16} className="text-vert mt-0.5 shrink-0" aria-hidden="true" />
                  Un abonnement pour toute la famille — plus vous êtes, moins chacun paie
                </li>
                <li className="flex items-start gap-2">
                  <Lock size={16} className="text-vert mt-0.5 shrink-0" aria-hidden="true" />
                  Vos recettes restent lisibles pour toujours, même sans abonnement
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles size={16} className="text-vert mt-0.5 shrink-0" aria-hidden="true" />
                  Sans publicité, sans relance agressive — pour toujours
                </li>
              </ul>

              {erreur && <p className="text-tomate text-sm">{erreur}</p>}

              {/* Appels à l’action */}
              <div className="space-y-2">
                {!dejaEssai ? (
                  <Button size="lg" className="w-full" onClick={ouvrirEssai} disabled={busy}>
                    {busy ? 'Un instant…' : 'Essayer 1 mois — sans carte'}
                  </Button>
                ) : (
                  <p className="text-center text-encre-doux text-sm">
                    L’essai a déjà été utilisé par votre famille — il n’y en a qu’un par
                    carnet.
                  </p>
                )}
                <Button variant="outline" className="w-full" onClick={rejoindreListe} disabled={busy}>
                  {busy ? 'Un instant…' : 'Rejoindre la liste d’attente'}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    rappelerDans6Mois()
                    onClose()
                  }}
                  className="w-full text-encre-doux underline decoration-encre-doux/30 underline-offset-4 hover:text-encre text-sm py-2 transition-colors"
                >
                  Nous rappeler dans 6 mois
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
