# Configuration Supabase pour Savia

> **Projet configuré** : `vibe-coding-platform` — ref `dnpjbvjonwrovyqjrmnw`
> URL : `https://dnpjbvjonwrovyqjrmnw.supabase.co`

## 1. Créer le projet (si ce n'est pas déjà fait)

1. Rendez-vous sur [supabase.com](https://supabase.com), créez un projet (région proche de vous).
2. Récupérez dans **Settings > API** :
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

## 2. Appliquer le schéma

**⚠️ À faire impérativement avant le premier lancement** : les 5 tables
(`families`, `profiles`, `invitations`, `recipes`, `favorites`), les policies RLS
et le bucket `recipe-photos` ne sont **pas encore créés** sur le projet.

Deux options :

**Via le dashboard (sans CLI)** — onglet **SQL Editor** :

1. **New query** → collez le **contenu** de
   [`migrations/0001_initial_schema.sql`](./migrations/0001_initial_schema.sql) (le code SQL, pas le chemin du fichier) → **Run**
2. **New query** → collez le **contenu** de
   [`migrations/0002_storage_bucket.sql`](./migrations/0002_storage_bucket.sql) → **Run**
   (crée le bucket `recipe-photos` et ses policies, au cas où le premier
   script aurait partiellement échoué)

> ⚠️ Erreur fréquente : coller le chemin `sivia/supabase/migrations/...` au lieu
> du contenu SQL → `ERROR: 42601: syntax error`. Le SQL Editor attend du **code SQL**.

**Via la CLI Supabase** (recommandé, nécessite un access token personnel) :

```bash
npx supabase login
npx supabase link --project-ref dnpjbvjonwrovyqjrmnw
npx supabase db push
```

## 3. Activer l'authentification par email

**Authentication > Providers > Email** : activez « Enable Email provider ».

> **Note sur la confirmation d'email** : par défaut, Supabase exige une
> confirmation par mail avant la première connexion. Deux options :
> - **Garder la confirmation** (recommandé) : configurez un fournisseur SMTP
>   (ou utilisez le SMTP intégré, limité) pour les vrais emails, dont le
>   « mot de passe oublié ».
> - **Désactiver la confirmation** (test uniquement) : décochez
>   « Confirm email » dans les settings Auth. Les comptes seront alors
>   immédiatement connectés à l'inscription.
>
> ⚠️ Le plan gratuit de Supabase applique une **limite de débit d'envoi
> d'emails** (rate limit). En cas de `over_email_send_rate_limit`, attendez
> quelques minutes ou désactivez temporairement la confirmation.

Dans **Authentication > URL Configuration**, ajoutez votre URL de site, par
exemple `http://localhost:5173` en local.

## 4. Vérifier la sécurité

Le schéma active la **Row Level Security** sur toutes les tables : un membre ne
peut lire/écrire que les données de **sa propre famille**. Testez dans
**Table Editor > (table) > RLS** que les policies sont bien actives.

## 5. (Optionnel) Données de démonstration

Après avoir créé votre compte et votre famille, vous pouvez charger des
recettes d'exemple via le SQL Editor :

```bash
# ou copier-coller supabase/seed/seed.sql dans le SQL Editor
```
