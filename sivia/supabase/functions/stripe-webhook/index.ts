// ============================================================================
// Sivia — webhook Stripe : active le plan payé d'une famille (service_role).
//
// Le garde-fou SQL guard_family_plan (migration 0012) autorise uniquement
// service_role/supabase_admin à écrire plan='actif' : ce webhook est donc
// le SEUL chemin d'activation payante, comme prévu par la spécification.
//
// Déploiement (une fois, voir sivia/docs/stripe.md) :
//   supabase functions deploy stripe-webhook --project-ref <ref>
// Secrets à définir :
//   supabase secrets set STRIPE_SECRET_KEY=... STRIPE_WEBHOOK_SECRET=...
//   (SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis d'office)
//
// Événements à écouter dans Stripe (Webhook endpoint) :
//   checkout.session.completed, invoice.payment_succeeded
// ============================================================================

import Stripe from 'npm:stripe@16.12.0'
import { createClient } from 'npm:@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-12-18.acacia',
})
const cryptoProvider = Stripe.createSubtleCryptoProvider()

function admin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  )
}

/** Étend la période payée d'une famille. Ne régresse jamais (garde le
 *  plus lointain des deux plan_expires_at) et écrit plan_source='paiement'. */
async function activerFamille(familyId: string, expiresAt: Date) {
  const supabase = admin()
  const { data } = await supabase
    .from('families')
    .select('plan_expires_at')
    .eq('id', familyId)
    .single()
  const actuel = data?.plan_expires_at ? new Date(data.plan_expires_at) : null
  // Le renouvellement part de la fin courante si elle est encore future.
  const base = actuel && actuel > new Date() ? actuel : new Date()
  if (actuel && actuel >= expiresAt) return // déjà couvert : idempotence
  await supabase
    .from('families')
    .update({
      plan: 'actif',
      plan_source: 'paiement',
      plan_started_at: new Date().toISOString(),
      plan_expires_at: expiresAt.toISOString(),
    })
    .eq('id', familyId)
}

/** Date d'expiration d'un abonnement Stripe : fin de la période en cours. */
async function expirationAbonnement(subscriptionId: string) {
  const sub = await stripe.subscriptions.retrieve(subscriptionId)
  return {
    expiresAt: new Date(sub.current_period_end * 1000),
    intervalMonths: sub.items.data[0]?.price.recurring?.interval === 'month'
      ? sub.items.data[0].price.recurring!.interval_count ?? 1
      : 12,
  }
}

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature ?? '',
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '',
      undefined,
      cryptoProvider,
    )
  } catch (_err) {
    return new Response('Signature webhook invalide', { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      // client_reference_id = id de la famille (posé par l'app, src/lib/paiement.ts)
      const familyId = session.client_reference_id
      if (familyId && typeof session.subscription === 'string') {
        const { expiresAt } = await expirationAbonnement(session.subscription)
        await activerFamille(familyId, expiresAt)
        // Le lien de paiement est partagé entre familles : on persiste la
        // famille sur l'abonnement pour que les renouvellements
        // (invoice.payment_succeeded) la retrouvent sans client_reference_id.
        await stripe.subscriptions.update(session.subscription, {
          metadata: { family_id: familyId },
        })
      } else if (familyId && session.mode === 'payment') {
        // Paiement unique (ex. le livre imprimé) : rien à activer côté plan.
        console.log('Paiement unique reçu pour la famille', familyId)
      }
    }

    if (event.type === 'invoice.payment_succeeded') {
      // Renouvellements : prolonge le plan à chaque prélèvement réussi.
      const invoice = event.data.object as Stripe.Invoice
      const familyId =
        (invoice.metadata?.family_id as string | undefined) ??
        (typeof invoice.subscription === 'string'
          ? (
              await stripe.subscriptions.retrieve(invoice.subscription)
            ).metadata?.family_id
          : undefined)
      if (familyId && typeof invoice.subscription === 'string') {
        const { expiresAt } = await expirationAbonnement(invoice.subscription)
        await activerFamille(familyId, expiresAt)
      }
    }
  } catch (err) {
    console.error('Webhook Sivia :', err)
    // 500 : Stripe réessaie automatiquement.
    return new Response('Erreur interne', { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'content-type': 'application/json' },
  })
})
