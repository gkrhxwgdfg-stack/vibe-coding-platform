# Savia — Recettes de famille

> **Savia. Le savoir qui se transmet à table.**

Savia est le carnet de recettes de votre famille — celui qui ne se perd jamais.
Rassemblez les recettes de ceux que vous aimez : les annotations à la main de
grand-mère, la photo du plat du dimanche, le secret de la sauce qui se transmet
de génération en génération.

## ✨ Fonctionnalités (MVP)

- **Inscription / connexion** (email + mot de passe, mot de passe oublié)
- **Groupe familial privé** avec **lien d'invitation sécurisé** (token, expiration 30 jours)
- **Publier une recette** : titre, catégorie, portions, temps, ingrédients, étapes, photo, anecdote, origine du plat
- **Recherche et filtres** : mot-clé (titre, ingrédients, étapes, anecdotes), catégorie, auteur
- **Favoris** ❤️
- **Fiche recette** : photo, ingrédients mis à l'échelle selon les portions (− / +), étapes numérotées, **anecdote mise en valeur**, **tampon d'authenticité** du créateur, origine et date de transmission
- **Sceller une recette** 🔒 (créateur uniquement) : l'original devient non modifiable
- **Espace famille** : membres, invitations (créer / copier / annuler)
- **Profil** : prénom, bio, tampon personnalisable, statistiques, déconnexion

### 🔒 Sécurité

Toute la sécurité repose sur la **Row Level Security (RLS)** de Supabase :
chaque groupe familial ne peut lire et écrire **que ses propres données**.
L'application vérifie également la famille côté client avant chaque requête.

### 🎨 Design

Identité chaleureuse et artisanale, pensée pour être utilisée par des
grands-parents :

- **Palette** : terracotta, moutarde, bleu ardoise, lin, crème, encre, sauge, carmine
- **Typographies** : Fraunces (titres), Nunito Sans (texte), Caveat (manuscrit)
- **Accessibilité** : typographie de base 17px, cibles tactiles ≥ 44px, focus
  visible, contraste élevé, parcours en 3 clics maximum

## 🛠 Stack technique

| Couche | Technologie |
| --- | --- |
| Front | React 19 + TypeScript + Vite |
| UI | Tailwind CSS 4 |
| Backend | Supabase (auth, base de données PostgreSQL, stockage photos) |
| Routage | React Router 7 |
| Déploiement | Vercel (recommandé) ou tout hébergeur statique |

## 🚀 Installation

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

## 📦 Build et déploiement

```bash
npm run build      # build de production dans dist/
npm run preview    # prévisualiser le build
```

### Déploiement sur Vercel (recommandé)

1. Connectez-vous sur [vercel.com](https://vercel.com) **avec le même compte
   GitHub** que celui qui possède le dépôt (sinon Vercel bloque le déploiement).
2. **Add New Project** → importez `gkrhxwgdfg-stack/vibe-coding-platform`.
3. **Root Directory** : `sivia` (l'app vit dans le sous-dossier `sivia/`).
4. **Framework Preset** : Vite (détecté automatiquement).
5. **Variables d'environnement** :
   | Variable | Valeur |
   | --- | --- |
   | `VITE_SUPABASE_URL` | `https://dnpjbvjonwrovyqjrmnw.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | votre clé anon (Settings > API) |
6. **Deploy** → l'URL est du type `https://<projet>.vercel.app`.

> Le fichier `vercel.json` gère le routage SPA (toutes les routes → `index.html`).

7. Dans Supabase (**Authentication > URL Configuration**), ajoutez l'URL Vercel
   au **Site URL** et aux **Redirect URLs** (`https://<projet>.vercel.app/**`).

### Alternative : Netlify

Le fichier `public/_redirects` est fourni pour le routage SPA. Même principe :
root directory `sivia`, mêmes variables d'environnement.

## 🗂 Structure du projet

```
sivia/
├── supabase/
│   ├── migrations/0001_initial_schema.sql   # tables, RLS, storage, triggers
│   ├── seed/seed.sql                        # recettes de démonstration
│   └── README.md                            # guide de configuration Supabase
├── src/
│   ├── components/
│   │   ├── ui/          # design system (Button, Card, Avatar, Stamp, Polaroid…)
│   │   ├── layout/      # AppLayout, AuthShell, RequireAuth
│   │   └── recipes/     # RecipeCard, RecipeForm
│   ├── context/         # AuthContext (session, profil, famille)
│   ├── hooks/           # useRecipes, useFamily, useInvitationByToken…
│   ├── services/        # logique métier Supabase (recipes.ts)
│   ├── lib/             # supabase client, types, utils, format, scale
│   ├── pages/           # une page par écran
│   └── App.tsx          # routes
└── public/              # favicon (cuillère-monogramme)
```

**Règle d'or du code** : aucune logique métier dans les vues. Les pages
orchestrent ; les hooks et `services/` portent la logique Supabase.

## 🧭 Feuille de route

- **v1 (livrée)** : MVP complet ci-dessus
- **v2 (volontairement non implémentée)** : mode cuisson avec minuteur,
  commentaires, export PDF / impression, timeline familiale, arbre généalogique,
  mode hors-ligne

## 📜 Licence

Projet familial privé — tous droits réservés.

---

*À très vite, autour de la table. — Savia*
