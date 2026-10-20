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

Suivez le guide détaillé : [`supabase/README.md`](./supabase/README.md)

En résumé :

1. Créez un projet Supabase, récupérez **Project URL** et **anon public key**
   (**Settings > API**).
2. Appliquez le schéma SQL : copiez-collez
   [`supabase/migrations/0001_initial_schema.sql`](./supabase/migrations/0001_initial_schema.sql)
   dans le **SQL Editor** du dashboard, ou via la CLI :
   `npx supabase db push`.
3. Activez le provider **Email** dans **Authentication > Providers**.
4. Ajoutez `http://localhost:5173` dans **Authentication > URL Configuration**.

### 4. Variables d'environnement

```bash
cp .env.example .env
```

Renseignez :

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
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

Déploiement sur **Vercel** : importez le dépôt, ajoutez les deux variables
`VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`, déployez.

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
