// Types métier de Sivia, alignés sur le schéma Supabase (supabase/migrations/0001_initial_schema.sql)

export type RecipeCategory =
  | 'entree'
  | 'plat'
  | 'dessert'
  | 'fete'
  | 'saison'
  | 'autre'

export type InvitationStatus = 'pending' | 'accepted' | 'declined'

export interface Profile {
  id: string
  display_name: string
  avatar_url: string | null
  bio: string | null
  /** Tampon d'authenticité (historique, conservé en base, non personnalisable) */
  stamp_emoji: string
  /** Lien dans la famille : « maman », « papi », « cousine Léa »… */
  family_role: string | null
  family_id: string | null
  created_at: string
}

export interface RecipeComment {
  id: string
  /** Recette visée, ou null pour un moment de la planche familiale */
  recipe_id: string | null
  /** Famille du commentaire (renseignée automatiquement) */
  family_id: string | null
  author_id: string
  /** Texte du commentaire (null si photo seule) */
  body: string | null
  /** Chemin dans le bucket storage (dossier = family_id) */
  photo_url: string | null
  created_at: string
  author?: Profile
}

export interface Family {
  id: string
  name: string
  created_by: string
  created_at: string
}

export interface Invitation {
  id: string
  family_id: string
  email: string
  token: string
  status: InvitationStatus
  invited_by: string | null
  created_at: string
  expires_at: string
  family?: Pick<Family, 'id' | 'name'>
}

export interface Recipe {
  id: string
  family_id: string
  author_id: string
  title: string
  category: RecipeCategory
  servings: number
  /** Temps en minutes */
  prep_time: number | null
  cook_time: number | null
  ingredients: string[]
  steps: string[]
  anecdote: string | null
  /** « Transmise par grand-mère Yvonne, depuis 1962 » */
  origin_story: string | null
  /** Chemin dans le bucket storage (pas d'URL absolue) */
  photo_url: string | null
  /** Recette scellée : l'original n'est plus modifiable */
  is_sealed: boolean
  created_at: string
  updated_at: string
}

export interface RecipeWithMeta extends Recipe {
  author?: Profile
  is_favorite?: boolean
}

export interface RecipeFilters {
  query: string
  category: RecipeCategory | 'toutes'
  authorId: string | 'tous'
}

export interface RecipeFormValues {
  title: string
  category: RecipeCategory
  servings: number
  prep_time: string
  cook_time: string
  ingredients: string[]
  steps: string[]
  anecdote: string
  origin_story: string
  photoFile: File | null
}

/** Membre « de l'arbre » : une personne de la famille, sans compte (ex : « Mamie Jeanne ») */
export interface FamilyMember {
  id: string
  family_id: string
  first_name: string
  last_name: string | null
  /** Lien familial : « maman », « papi », « cousine Léa »… */
  family_role: string | null
  /** Chemin de la photo dans le bucket storage */
  photo_url: string | null
  /** Rang/génération : 1 = les aînés, 2 = leurs enfants… */
  generation: number
  parent_id: string | null
  /** Membre de l'arbre lié à un compte Supabase (badge « membre connecté ») */
  linked_profile_id: string | null
  created_by: string
  created_at: string
}

/** Repas de famille : un souvenir du menu, sur la chronologie */
export interface FamilyEvent {
  id: string
  family_id: string
  title: string
  /** Date du repas (format ISO AAAA-MM-JJ) */
  event_date: string
  note: string | null
  photo_url: string | null
  created_by: string
  created_at: string
  /** Recettes servies à l'événement (menu) */
  recipes?: { id: string; title: string }[]
}
