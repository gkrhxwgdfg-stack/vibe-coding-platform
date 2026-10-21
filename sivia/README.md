# Savia — Recettes de famille

> **Savia. Le savoir qui se transmet en cuisine.**

Savia est le carnet de recettes de votre famille — celui qui ne se perd jamais.
Rassemblez les recettes de ceux que vous aimez : les annotations à la main de
grand-mère, la photo du plat du dimanche, le secret de la sauce qui se transmet
de génération en génération.

## Fonctionnalités (MVP)

- **Inscription / connexion** (email + mot de passe, mot de passe oublié)
- **Groupe familial privé** avec **lien d'invitation sécurisé** (token, expiration 30 jours)
- **Publier une recette** : titre, catégorie, portions, temps, ingrédients, étapes, photo, anecdote, origine du plat
- **Recherche et filtres** : mot-clé (titre, ingrédients, étapes, anecdotes), catégorie, auteur
- **Favoris** (cœur sur une recette)
- **Fiche recette** : photo, ingrédients mis à l'échelle selon les portions (− / +), étapes numérotées, **anecdote mise en valeur**, **tampon d'authenticité** (cercle tamponné au nom du créateur), origine et date de transmission
- **Commentaires et photos** : chaque recette porte son **fil de vie** — la famille commente, partage ses photos, et on voit quand la recette est utilisée
- **Accueil vivant** : **planche familiale** (tableau de photos partagées) et **notifications** des derniers contenus de la famille
- **Sceller une recette** (créateur uniquement) : l'original devient non modifiable
- **Mode cuisson** : diaporama plein écran, une étape à la fois (swipe, flèches clavier), ingrédients de l'étape surlignés, écran maintenu allumé (Wake Lock) et **minuteur façon horloge artisanale** (contour pointillé terracotta, deux aiguilles, décompte au centre, alerte visuelle carmine à la fin — sans son)
- **Export « carnet familial »** : bouton « Télécharger la recette » — mise en forme originale (titre Fraunces, photo polaroïd, anecdote manuscrite en Caveat, tampon d'authenticité, origine et date de transmission), imprimable / enregistrable en PDF depuis le navigateur
- **Espace famille** : membres avec leur **lien familial** (maman, papi…), **renommage de la famille**, invitations (créer / copier / annuler), **arbre généalogique piloté par des « + » et des scotchs** : l'arbre **descend** de génération en génération (les aînés — la base — en haut, les jeunes en dessous), la génération de chacun est calculée **uniquement à partir des liens** ; le « + » sous une personne ajoute un **enfant** en dessous, le **scotch « + »** sur le côté d'une carte ajoute un **partenaire** à côté (même génération — les couples sont « scotchés » ensemble par un vrai ruban adhésif), le « + » carmine en haut ajoute un **aîné** au-dessus (les racines existantes deviennent ses enfants) ; le lien s'écrit **librement** sur la carte ; l'arbre est **centré** et compact, la corde est dessinée en SVG avec relief et **chronologie des repas de famille** (événements, menu servi, photos — le « souvenir du menu »)
- **Bouton « + » contextuel** : action selon la page (photo planche / nouvelle recette ; absent sur famille — l'arbre a ses propres « + » et scotchs —, favoris et profil)
- **Profil** : prénom, bio, lien dans la famille, statistiques, déconnexion
### Sécurité

Toute la sécurité repose sur la **Row Level Security (RLS)** de Supabase :
chaque groupe familial ne peut lire et écrire **que ses propres données**.
L'application vérifie également la famille côté client avant chaque requête.

### Design

Identité chaleureuse et artisanale, pensée pour être utilisée par des
grands-parents :

- **Palette** : terracotta, moutarde, bleu ardoise, lin, crème, encre, sauge, carmine, brun/cacao
- **Typographies** : Fraunces (titres), Nunito Sans (texte), Caveat (manuscrit)
- **Accessibilité** : typographie de base 17px, cibles tactiles ≥ 44px, focus
  visible, contraste élevé, parcours en 3 clics maximum

## Stack technique

| Couche | Technologie |
| --- | --- |
| Front | React 19 + TypeScript + Vite |
| UI | Tailwind CSS 4 |
| Backend | Supabase (auth, base de données PostgreSQL, stockage photos) |
| Commentaires | Table `recipe_comments` + photos dans le bucket `recipe-photos` |
| Routage | React Router 7 |
| Déploiement | Vercel (recommandé) ou tout hébergeur statique |

## Installation

### 1. Prérequis

- Node.js ≥ 20
- Un projet [Supabase](https://supabase.com) (gratuit)

### 2. Cloner et installer

```bash
git clone <url-du-depot>
cd sivia
npm install
```

### 3. Configurer Supabase

**Projet déjà créé** : `vibe-coding-platform` (ref `dnpjbvjonwrovyqjrmnw`).

Suivez le guide détaillé : [`supabase/README.md`](./supabase/README.md)

En résumé :

1. Récupérez **Project URL** (`https://dnpjbvjonwrovyqjrmnw.supabase.co`) et
   **anon public key** dans **Settings > API**.
2. **Appliquez le schéma SQL** (obligatoire, à faire une seule fois) : copiez-collez
   [`supabase/migrations/0001_initial_schema.sql`](./supabase/migrations/0001_initial_schema.sql)
   dans le **SQL Editor** du dashboard, ou via la CLI :
   `npx supabase db push`.
3. Activez le provider **Email** dans **Authentication > Providers**
   (pensez à la confirmation d'email, voir note dans `supabase/README.md`).
4. Ajoutez `http://localhost:5173` dans **Authentication > URL Configuration**.

### 4. Variables d'environnement

```bash
cp .env.example .env
```

Renseignez :

```env
VITE_SUPABASE_URL=https://dnpjbvjonwrovyqjrmnw.supabase.co
VITE_SUPABASE_ANON_KEY=<votre anon key — Settings > API>
```

> La clé `anon` est publique par conception : la sécurité est assurée par la RLS.

### 5. Lancer

```bash
npm run dev
```

Ouvrez [http://localhost:5173](http://localhost:5173).

## Build et déploiement

```bash
npm run build      # build de production dans dist/
npm run preview    # prévisualiser le build
```

### Déploiement en ligne (Vercel — testé et fonctionnel)

**URL publique de l'application** :
**https://temporary-rapid-pumice-22jbvag.vercel.app**

> C'est un déploiement temporaire Vercel (expire dans 60 min). Pour un lien
> **permanent et automatique** à chaque push, deux options :

#### Option A — Vercel CLI en CI (recommandé, 100 % automatique)

Le workflow [`.github/workflows/deploy-sivia-vercel.yml`](../.github/workflows/deploy-sivia-vercel.yml)
déploie automatiquement sur Vercel à chaque push. GitHub Pages étant bloqué
sur ce dépôt privé (nécessite un compte GitHub payant), Vercel CLI est la
solution gratuite et autonome.

Configuration (une seule fois, 3 minutes) :

1. Créez un **token Vercel** : [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Dans GitHub : **Settings → Secrets and variables → Actions**
   - **Secrets** → `VERCEL_TOKEN` = votre token
   - **Variables** → `VITE_SUPABASE_URL` = `https://dnpjbvjonwrovyqjrmnw.supabase.co`
   - **Variables** → `VITE_SUPABASE_ANON_KEY` = votre clé anon
3. Poussez un commit → le déploiement se lance tout seul → l'URL permanente
   apparaît dans les logs du job (onglet **Actions**).

#### Option B — Vercel manuel (depuis le dashboard)

1. Créez un compte sur [vercel.com](https://vercel.com) avec votre GitHub
2. **Add New Project** → importez `gkrhxwgdfg-stack/vibe-coding-platform`
3. **Root Directory** : `sivia` · **Framework** : Vite
4. Variables d'environnement : `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
5. **Deploy** → URL permanente du type `https://sivia-xxx.vercel.app`

> Le fichier `sivia/vercel.json` gère le routage SPA (toutes les routes → `index.html`).

### GitHub Pages (déploiement actif — dépôt public)

Le workflow [`.github/workflows/pages.yml`](../.github/workflows/pages.yml)
build et déploie automatiquement à chaque push sur `main`.

**URL cible** : https://gkrhxwgdfg-stack.github.io/vibe-coding-platform/

### Dernière étape (toutes les options)

Dans Supabase (**Authentication → URL Configuration**), mettez :

- **Site URL** : `https://gkrhxwgdfg-stack.github.io/vibe-coding-platform/`
- **Redirect URLs** : `https://gkrhxwgdfg-stack.github.io/vibe-coding-platform/**`

## Structure du projet

```
sivia/
├── supabase/
│   ├── migrations/0001_initial_schema.sql   # tables, RLS, storage, triggers
│   ├── migrations/0006_comments_and_family_role.sql  # commentaires, lien familial
│   ├── migrations/0007_planche_family_photos.sql    # planche : commentaires sans recette
│   ├── migrations/0008_family_tree_and_events.sql   # arbre généalogique + événements
│   ├── migrations/0009_family_tree_v2_generations_and_relations.sql  # générations nommées, édition, liens typés
│   ├── migrations/0010_family_tree_links_kind.sql    # arbre complet : liens parent / conjoint
│   ├── migrations/0011_family_members_parent2.sql     # arbre : relié à une ou deux personnes
│   ├── seed/seed.sql                        # recettes de démonstration
│   └── README.md                            # guide de configuration Supabase
├── src/
│   ├── components/
│   │   ├── ui/          # design system (Button, Card, Avatar, Stamp, Polaroid…)
│   │   ├── layout/      # AppLayout, AuthShell, RequireAuth, AddButton
│   │   ├── recipes/     # RecipeCard, RecipeForm, CommentThread, CookingTimer
│   │   ├── planche/     # AddPhotoModal (moments de la planche familiale)
│   │   └── family/      # FamilyTree, FamilyMemberCard, FamilyMemberModal, FamilyEvents
│   ├── context/         # AuthContext (session, profil, famille)
│   ├── hooks/           # useRecipes, useFamily, useComments, useFamilyTree…
│   ├── services/        # logique métier Supabase (recipes.ts, comments.ts, familyTree.ts, recipePrint.ts)
│   ├── lib/             # supabase client, types, utils, format, scale, cooking, addAction, familyTreeLayout
│   ├── pages/           # une page par écran
│   └── App.tsx          # routes
└── public/              # favicon (cuillère-monogramme)
```

**Règle d'or du code** : aucune logique métier dans les vues. Les pages
orchestrent ; les hooks et `services/` portent la logique Supabase.

## Feuille de route

- **v1 (livrée)** : MVP complet ci-dessus, **commentaires et photos** compris
- **v2 (volontairement non implémentée)** : mode cuisson avec minuteur,
  export PDF / impression, timeline familiale, arbre généalogique,
  mode hors-ligne

## Licence

Projet familial privé — tous droits réservés.

---

*À très vite, en cuisine. — Savia*
