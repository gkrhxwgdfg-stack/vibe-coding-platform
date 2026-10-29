# Savia — Recettes de famille

> **Savia. Le savoir qui se transmet en cuisine.**

Savia est le carnet de recettes de votre famille — celui qui ne se perd jamais.
Rassemblez les recettes de ceux que vous aimez : les annotations à la main de
grand-mère, la photo du plat du dimanche, le secret de la sauce qui se transmet
de génération en génération.

## Fonctionnalités (v2 livrée)

- **Inscription / connexion** (email + mot de passe, mot de passe oublié)
- **Groupe familial privé** avec **lien d'invitation sécurisé** (token, expiration 30 jours)
- **Publier une recette** : titre, catégorie, portions, temps, ingrédients, étapes, photo, anecdote, origine du plat
- **Recherche et filtres** : mot-clé (titre, ingrédients, étapes, anecdotes), catégorie, auteur
- **Favoris** (cœur sur une recette)
- **Fiche recette v2** : **tampon d'authenticité** animé à l'entrée, **bandeau de transmission** (qui a transmis, depuis quand, cuisinée N fois), **cases ingrédients cochables**, ingrédients mis à l'échelle selon les portions (− / +), étapes numérotées, **anecdote en exergue** (papier âgé, bord ondulé, Caveat), bouton « Cuisiner » sticky en bas de fiche
- **Commentaires et photos** : chaque recette porte son **fil de vie** — la famille commente, partage ses photos, et on voit quand la recette est utilisée
- **Accueil vivant** : **planche familiale animée** (cascade de polaroïds, rubans Washi), carte « Le plat du dimanche » (sélection stable par jour), **notifications** des derniers contenus de la famille
- **Sceller une recette** (créateur uniquement) : l'original devient non modifiable
- **Mode cuisson v2** : écran « La mise en place » (checklist ingrédients + portions), diaporama plein écran une étape à la fois (flèches 64 px, swipe, clavier), barre couture de progression, ingrédients de l'étape surlignés moutarde, écran maintenu allumé (Wake Lock), **minuteurs libellés** (cercle couture, pré-alerte 1 min, fin carmine + vibration, son muet par défaut), écran « C'est prêt ! » avec confettis papier, écriture automatique « Cuisinée par {prénom} le {date} » dans le fil de vie, persistance localStorage (reprise après verrouillage)
- **Export PDF fiche recette** : bouton « Télécharger (PDF) » — A5 multi-pages (titre Fraunces, photo polaroïd, bandeau transmission, ingrédients 2 colonnes, étapes numérotées, anecdote Caveat sur papier âgé, tampon, pied de page famille), polices TTF embarquées, nom `sivia—{titre}—{famille}.pdf` ; impression navigateur conservée en 2e choix
- **Export « Le carnet de {famille} »** : livre A5 complet (couverture + mini-arbre des générations, page de garde, sommaire, recettes scellées d'abord puis par catégorie, index par auteur, intercalaires anecdotes), pieds de page numérotés, notification dans le fil de vie
- **Espace famille** : membres avec leur **lien familial** (maman, papi…), **renommage de la famille**, invitations (créer / copier / annuler), **arbre généalogique piloté par des « + » et des scotchs** : l'arbre **descend** de génération en génération (les aînés — la base — en haut, les jeunes en dessous), la génération de chacun est calculée **uniquement à partir des liens** ; le « + » sous une personne ajoute un **enfant** en dessous, le **scotch « + »** sur le côté d'une carte ajoute un **partenaire** à côté (même génération — les couples sont « scotchés » ensemble par un vrai ruban adhésif), le « + » carmine en haut ajoute un **aîné** au-dessus (les racines existantes deviennent ses enfants) ; le lien s'écrit **librement** sur la carte ; l'arbre est **centré** et compact, la corde est dessinée en SVG avec relief et **chronologie des repas de famille** (événements, menu servi, photos — le « souvenir du menu »)
- **Bouton « + » contextuel** : action selon la page (photo planche / nouvelle recette ; absent sur famille — l'arbre a ses propres « + » et scotchs —, favoris et profil)
- **Profil** : prénom, bio, lien dans la famille, statistiques, **réglage « Taille du texte »** (Standard / Grande / Très grande), déconnexion
### Sécurité

Toute la sécurité repose sur la **Row Level Security (RLS)** de Supabase :
chaque groupe familial ne peut lire et écrire **que ses propres données**.
L'application vérifie également la famille côté client avant chaque requête.

### Design — système graphique « Farine & Blé »

Identitée chaleureuse et épurée, pensée pour être utilisée par des
grands-parents. La matière (farine, sauce, caramel, marginalia, tampons) vit
dans les fonds et les structures ; les contrôles restent modernes et épurés.

- **Palette** (`src/index.css`, tokens `--sivia-*`) : papier, carte, encre,
  vert (structure), tomate (action/émotion), blé (décor, jamais texte),
  cannelle (line-arts), bois (épingles)
- **Typographies** : Fraunces (titres, italique réservé à l'émotion), Nunito
  (corps, graisses 400/700/800)
- **Motifs** (§ bibliothèque) : farine tamisée (M3), vichy torchon (M4),
  cadre couture (M6), pluie de farine (M1, accueil), étoile M2 (succès),
  traces d'ingrédient par catégorie (herbes/sauce/caramel/cannelle — fiche
  recette uniquement), corde à linge + polaroïds à épingle (toutes les
  photos), arbre généalogique line-art (membres = feuilles, recettes =
  fruits)
- **Structures du livre** : folio « Recette n° X », filets doubles, estampille
  « Testée & approuvée » dès 2 favoris familiaux, marginalia (1 max/page)
- **Accessibilité** : typographie de base 18px, **réglage « Taille du texte »**
  (Standard / Grande 20px / Très grande 22px — proposé dès l'onboarding et
  dans le profil), cibles tactiles ≥ 44px (52px en grande lecture), focus
  visible (ring vert 3px), **contrastes WCAG AA vérifiés sur toutes les paires
  texte/fond**, `aria-label` sur toutes les icônes seules,
  `prefers-reduced-motion` coupe pluie/balance/scintillement, parcours en 3
  clics maximum
- **Motion** : système de tokens (`src/lib/motion.ts` + utilitaires CSS) —
  cascade d'entrée, tampon qui se pose, squelettes « farine tamisée »,
  soulignement glissant

## Stack technique

| Couche | Technologie |
| --- | --- |
| Front | React 19 + TypeScript + Vite |
| UI | Tailwind CSS 4 |
| Backend | Supabase (auth, base de données PostgreSQL, stockage photos) |
| Commentaires | Table `recipe_comments` + photos dans le bucket `recipe-photos` |
| PDF | jsPDF (import dynamique au clic, polices Fraunces/Caveat en TTF) |
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
│   │   ├── ui/          # design system (Button, Card, Avatar, Stamp, Polaroid, Washi, Torchon, EmptyState, ErrorState, ReadingSizePicker…)
│   │   ├── layout/      # AppLayout, AuthShell, RequireAuth, AddButton
│   │   ├── recipes/     # RecipeCard, DailyRecipeCard, RecipeForm, CommentThread, CookingTimerV2, IngredientChecklist, TransmissionBanner
│   │   ├── planche/     # AddPhotoModal (moments de la planche familiale)
│   │   └── family/      # FamilyTree, FamilyMemberCard, FamilyMemberModal, FamilyEvents, Tape
│   ├── context/         # AuthContext (session, profil, famille)
│   ├── hooks/           # useRecipes, useFamily, useComments, useFamilyTree, useCookedCount, useReadingSize…
│   ├── services/        # logique métier Supabase (recipes.ts, comments.ts, familyTree.ts, recipePdf.ts, familyBookPdf.ts)
│   ├── lib/             # supabase client, types, utils, format, scale, motion, readingSize, cooking, cookingSession, copy (charte éditoriale), familyTreeLayout
│   ├── pages/           # une page par écran (+ auth/, CookingPage plein écran)
│   ├── index.css        # design tokens (@theme), utilitaires motion, grande lecture (.reading-lg/.reading-xl), feuille print A5
│   └── App.tsx          # routes
└── public/
    ├── favicon.svg      # cuillère-monogramme
    └── fonts/           # Fraunces + Caveat en TTF (embarqués dans les PDF)
```

**Règle d'or du code** : aucune logique métier dans les vues. Les pages
orchestrent ; les hooks et `services/` portent la logique Supabase.

## Feuille de route

- **v1 (livrée)** : MVP complet, **commentaires et photos** compris
- **v2 (livrée)** : dossier de raffinement v2 en 8 chantiers — fondations
  motion + tokens, ton de voix Savia, accueil/bibliothèque animés, fiche
  recette v2 (tampon, transmission, anecdote), mode cuisson v2 (mise en place,
  minuteurs, fil de vie), export PDF fiche + impression, **le carnet familial
  en livre A5**, grande lecture + audit accessibilité WCAG AA
- **v3 (volontairement non implémentée)** : mode hors-ligne, timeline
  familiale détaillée, impression avancée

## Licence

Projet familial privé — tous droits réservés.

---

*À très vite, en cuisine. — Savia*
