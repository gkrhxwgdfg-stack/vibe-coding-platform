# Configuration Supabase pour Savia

> **Projet configuré** : `vibe-coding-platform` — ref `dnpjbvjonwrovyqjrmnw`
> URL : `https://dnpjbvjonwrovyqjrmnw.supabase.co`

## 1. Créer le projet (si ce n'est pas déjà fait)

1. Rendez-vous sur [supabase.com](https://supabase.com), créez un projet (région proche de vous).
2. Récupérez dans **Settings > API** :
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

## 2. Appliquer le schéma

**À faire impérativement avant le premier lancement** : les 11 tables
(`families`, `profiles`, `invitations`, `recipes`, `favorites`, `recipe_comments`,
`family_members`, `family_generations`, `family_events`, `event_recipes`,
`family_waitlist`),
les policies RLS et le bucket `recipe-photos` ne sont **pas encore créés** sur le projet.

**Via le dashboard (sans CLI)** — onglet **SQL Editor**, exécutez **dans l'ordre** :

1. **New query** → collez le **contenu** de
   [`migrations/0001_initial_schema.sql`](./migrations/0001_initial_schema.sql) → **Run**
2. **New query** → collez le **contenu** de
   [`migrations/0002_storage_bucket.sql`](./migrations/0002_storage_bucket.sql) → **Run**
3. **New query** → collez le **contenu** de
   [`migrations/0004_rls_fix_all.sql`](./migrations/0004_rls_fix_all.sql) → **Run**
   (corrige les policies RLS, recrée le bucket, rend le trigger idempotent)
4. **New query** → collez le **contenu** de
   [`migrations/0005_rls_permissive_insert.sql`](./migrations/0005_rls_permissive_insert.sql) → **Run**
   (**OBLIGATOIRE** — ajoute `to authenticated` sur toutes les policies RLS,
   sans quoi les INSERT échouent avec `new row violates row-level security policy`)
5. **New query** → collez le **contenu** de
   [`migrations/0006_comments_and_family_role.sql`](./migrations/0006_comments_and_family_role.sql) → **Run**
   (ajoute la table `recipe_comments` pour le fil de vie des recettes — commentaires
   et photos — et la colonne `profiles.family_role` pour le lien dans la famille)
6. **New query** → collez le **contenu** de
   [`migrations/0007_planche_family_photos.sql`](./migrations/0007_planche_family_photos.sql) → **Run**
   (planche familiale : `recipe_comments.recipe_id` devient nullable et un commentaire
   peut être rattaché à la famille seule, sans recette)
7. **New query** → collez le **contenu** de
   [`migrations/0008_family_tree_and_events.sql`](./migrations/0008_family_tree_and_events.sql) → **Run**
   (arbre généalogique : tables `family_members`, `family_events` et `event_recipes`,
   avec RLS identique au reste du schéma)
8. **New query** → collez le **contenu** de
   [`migrations/0009_family_tree_v2_generations_and_relations.sql`](./migrations/0009_family_tree_v2_generations_and_relations.sql) → **Run**
   (arbre v2 : table `family_generations` pour les générations nommées en onglets,
   `family_members.generation_id` remplace l'ancien entier `generation`,
   et `family_members.relation_label` pour les liens familiaux typés)
9. **New query** → collez le **contenu** de
   [`migrations/0010_family_tree_links_kind.sql`](./migrations/0010_family_tree_links_kind.sql) → **Run**
   (arbre complet : `family_members.link_kind` distingue les liens de parenté
   (`parent` = branche descendante) des liens de couple (`partner` = branche horizontale))
10. **New query** → collez le **contenu** de
   [`migrations/0011_family_members_parent2.sql`](./migrations/0011_family_members_parent2.sql) → **Run**
   (arbre simplifié : `family_members.parent2_id` pour « relié à une ou deux personnes »)
11. **New query** → collez le **contenu** de
   [`migrations/0012_famille_plan.sql`](./migrations/0012_famille_plan.sql) → **Run**
   (**Phase 1 monétisation « Sivia Famille »** : colonnes `plan`, `plan_started_at`,
   `plan_expires_at`, `plan_source` sur `families` (gratuit / essai / actif / expire),
   trigger `families_plan_guard` — seul le service (webhook Stripe) peut activer
   un plan payé, les membres peuvent uniquement ouvrir l'essai d'un mois sans
   carte, dates fixées par le serveur — et table `family_waitlist` avec RLS)
12. **New query** → collez le **contenu** de
   [`migrations/0013_family_waitlist_update_delete.sql`](./migrations/0013_family_waitlist_update_delete.sql) → **Run**
   (policies UPDATE et DELETE sur `family_waitlist` : un membre peut corriger ou
   retirer l'inscription de sa famille ; sans policy UPDATE, l'inscription
   échoue avec une erreur RLS — constat du test bout-en-bout)

> Erreur fréquente : coller le chemin `sivia/supabase/migrations/...` au lieu
> du contenu SQL → `ERROR: 42601: syntax error`. Le SQL Editor attend du **code SQL**.

> **Vérification** : ouvrez [l'application](https://gkrhxwgdfg-stack.github.io/vibe-coding-platform/diagnostic)
> et allez sur `/diagnostic` — tous les voyants doivent être verts.

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
> Le plan gratuit de Supabase applique une **limite de débit d'envoi
> d'emails** (rate limit). En cas de `over_email_send_rate_limit`, attendez
> quelques minutes ou désactivez temporairement la confirmation.

Dans **Authentication > URL Configuration**, mettez :

- **Site URL** : `https://gkrhxwgdfg-stack.github.io/vibe-coding-platform/`
- **Redirect URLs** : `https://gkrhxwgdfg-stack.github.io/vibe-coding-platform/**`
  (en local, gardez aussi `http://localhost:5173/**`)

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
