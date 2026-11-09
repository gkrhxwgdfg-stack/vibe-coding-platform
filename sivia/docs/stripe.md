# Sivia Plus — brancher Stripe (guide complet)

Le code est prêt : il ne reste qu'à créer les liens de paiement et à déployer
le webhook. Tant que ce n'est pas fait, le paywall garde son parcours actuel
(essai sans carte + liste d'attente), rien ne casse.

## Comment c'est câblé

- **Paiement** : le bouton du paywall ouvre un **Payment Link** Stripe
  (page de paiement hébergée par Stripe, aucune donnée carte ne passe par
  Sivia). Le lien transporte `client_reference_id` = id de la famille et
  l'e-mail pré-rempli (`src/lib/paiement.ts`).
- **Activation** : le webhook `supabase/functions/stripe-webhook` reçoit les
  événements Stripe, vérifie la signature, et écrit `plan='actif'` /
  `plan_source='paiement'` sur la famille via la clé `service_role`. Le
  garde-fou SQL `guard_family_plan` (migration 0012) n'autorise QUE ce
  chemin pour un plan payé : le client ne peut pas s'auto-activer.
- **Renouvellements** : `invoice.payment_succeeded` prolonge
  `plan_expires_at` à chaque prélèvement réussi, sans jamais régresser.

## Étapes (≈ 15 minutes)

1. **Compte Stripe** : https://dashboard.stripe.com/register (mode test
   d'abord, puis activation du compte réel).

2. **Créer les deux liens de paiement** (Dashboard > Payment links >
   + New) :
   - **Sivia Plus — année** : produit récurrent 24,99 € / an
     (12 mois, 13ᵉ offert = 13 mois si tu préfères : mettre 24,99 € / 13 mois
     n'est pas possible en standard, rester sur /an).
   - **Sivia Plus — mois** : produit récurrent 2,99 € / mois.
   Dans les deux cas : activer « Add subscription data » > **Metadata** >
     `family_id = {family_id}` (permet au webhook de retrouver la famille
     aussi lors des renouvellements).

3. **Coller les liens dans l'app** (une des deux méthodes) :
   - Variables de build `VITE_STRIPE_LINK_ANNUEL` / `VITE_STRIPE_LINK_MENSUEL`
     (GitHub : Settings > Secrets and variables > Actions > **Variables** ;
     Vercel : Settings > Environment Variables).
   - Ou directement dans `src/lib/paiement.ts` (`LIENS_DIRECTS`).

4. **Déployer le webhook** (Supabase CLI) :
   ```bash
   supabase functions deploy stripe-webhook --project-ref dnpjbvjonwrovyqjrmnw
   supabase secrets set STRIPE_SECRET_KEY=sk_... --project-ref dnpjbvjonwrovyqjrmnw
   ```
   (`SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont injectés d'office.)

5. **Créer l'endpoint webhook dans Stripe** (Dashboard > Developers >
   Webhooks > Add endpoint) :
   - URL : `https://dnpjbvjonwrovyqjrmnw.supabase.co/functions/v1/stripe-webhook`
   - Événements : `checkout.session.completed`, `invoice.payment_succeeded`
   - Récupérer le **signing secret** (whsec_...) puis :
     ```bash
     supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_... --project-ref dnpjbvjonwrovyqjrmnw
     ```

6. **Test** : payer en mode test (carte 4242 4242 4242 4242) depuis le
   paywall, vérifier dans Supabase (Table editor > families) que
   `plan = actif`, `plan_source = paiement`.

## Notes

- Un seul paieur par famille : le plan est posé sur la ligne `families`,
  toute la famille en profite (conception initiale).
- Sans lien configuré, le bouton « Payer » n'apparaît pas : le parcours
  essai + liste d'attente reste tel quel.
- Le livre imprimé (39 €) peut être un simple Payment Link sans abonnement :
  il n'active rien côté plan, c'est un achat ponctuel.
