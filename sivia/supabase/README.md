# Configuration Supabase pour Savia

## 1. Créer le projet

1. Rendez-vous sur [supabase.com](https://supabase.com), créez un projet (région proche de vous).
2. Récupérez dans **Settings > API** :
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

## 2. Appliquer le schéma

Deux options :

**Via le dashboard (sans CLI)** — onglet **SQL Editor**, collez le contenu de
[`migrations/0001_initial_schema.sql`](./migrations/0001_initial_schema.sql) et exécutez.

**Via la CLI Supabase** (recommandé en local) :

```bash
npx supabase link --project-ref <votre-project-ref>
npx supabase db push
```

## 3. Activer l'authentification par email

**Authentication > Providers > Email** : activez « Enable Email provider ».
Désactivez « Confirm email » si vous voulez tester sans boîte mail (déconseillé
en production), ou configurez un fournisseur SMTP pour les vrais emails
(dont le « mot de passe oublié »).

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
