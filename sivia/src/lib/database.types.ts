// Types générés à la main à partir de supabase/migrations/0001_initial_schema.sql
// (Régénération possible avec : supabase gen types typescript --local > src/lib/database.types.ts)

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      families: {
        Row: {
          id: string
          name: string
          created_by: string
          created_at: string
          plan: 'gratuit' | 'essai' | 'actif' | 'expire'
          plan_started_at: string | null
          plan_expires_at: string | null
          plan_source: 'essai' | 'paiement' | 'cadeau' | null
        }
        Insert: {
          id?: string
          name: string
          created_by: string
          created_at?: string
          plan?: 'gratuit' | 'essai' | 'actif' | 'expire'
          plan_started_at?: string | null
          plan_expires_at?: string | null
          plan_source?: 'essai' | 'paiement' | 'cadeau' | null
        }
        Update: {
          id?: string
          name?: string
          created_by?: string
          created_at?: string
          plan?: 'gratuit' | 'essai' | 'actif' | 'expire'
          plan_started_at?: string | null
          plan_expires_at?: string | null
          plan_source?: 'essai' | 'paiement' | 'cadeau' | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          display_name: string
          avatar_url: string | null
          bio: string | null
          stamp_emoji: string
          family_role: string | null
          family_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          display_name: string
          avatar_url?: string | null
          bio?: string | null
          stamp_emoji?: string
          family_role?: string | null
          family_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          avatar_url?: string | null
          bio?: string | null
          stamp_emoji?: string
          family_role?: string | null
          family_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_family_id_fkey'
            columns: ['family_id']
            isOneToOne: false
            referencedRelation: 'families'
            referencedColumns: ['id']
          },
        ]
      }
      invitations: {
        Row: {
          id: string
          family_id: string
          email: string
          token: string
          status: 'pending' | 'accepted' | 'declined'
          invited_by: string | null
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          family_id: string
          email: string
          token?: string
          status?: 'pending' | 'accepted' | 'declined'
          invited_by?: string | null
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          email?: string
          token?: string
          status?: 'pending' | 'accepted' | 'declined'
          invited_by?: string | null
          created_at?: string
          expires_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'invitations_family_id_fkey'
            columns: ['family_id']
            isOneToOne: false
            referencedRelation: 'families'
            referencedColumns: ['id']
          },
        ]
      }
      recipes: {
        Row: {
          id: string
          family_id: string
          author_id: string
          title: string
          category: 'entree' | 'plat' | 'dessert' | 'fete' | 'saison' | 'autre'
          servings: number
          prep_time: number | null
          cook_time: number | null
          ingredients: string[]
          steps: string[]
          anecdote: string | null
          origin_story: string | null
          photo_url: string | null
          is_sealed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id: string
          author_id: string
          title: string
          category: 'entree' | 'plat' | 'dessert' | 'fete' | 'saison' | 'autre'
          servings?: number
          prep_time?: number | null
          cook_time?: number | null
          ingredients?: string[]
          steps?: string[]
          anecdote?: string | null
          origin_story?: string | null
          photo_url?: string | null
          is_sealed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          author_id?: string
          title?: string
          category?: 'entree' | 'plat' | 'dessert' | 'fete' | 'saison' | 'autre'
          servings?: number
          prep_time?: number | null
          cook_time?: number | null
          ingredients?: string[]
          steps?: string[]
          anecdote?: string | null
          origin_story?: string | null
          photo_url?: string | null
          is_sealed?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'recipes_family_id_fkey'
            columns: ['family_id']
            isOneToOne: false
            referencedRelation: 'families'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'recipes_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      recipe_comments: {
        Row: {
          id: string
          recipe_id: string | null
          family_id: string | null
          author_id: string
          body: string | null
          photo_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          recipe_id?: string | null
          family_id?: string | null
          author_id: string
          body?: string | null
          photo_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string | null
          family_id?: string | null
          author_id?: string
          body?: string | null
          photo_url?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'recipe_comments_recipe_id_fkey'
            columns: ['recipe_id']
            isOneToOne: false
            referencedRelation: 'recipes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'recipe_comments_family_id_fkey'
            columns: ['family_id']
            isOneToOne: false
            referencedRelation: 'families'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'recipe_comments_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      family_generations: {
        Row: {
          id: string
          family_id: string
          name: string
          position: number
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          name: string
          position?: number
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          name?: string
          position?: number
          created_by?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'family_generations_family_id_fkey'
            columns: ['family_id']
            isOneToOne: false
            referencedRelation: 'families'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'family_generations_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      family_members: {
        Row: {
          id: string
          family_id: string
          first_name: string
          last_name: string | null
          family_role: string | null
          photo_url: string | null
          generation_id: string | null
          parent_id: string | null
          parent2_id: string | null
          link_kind: 'parent' | 'partner' | null
          relation_label: string | null
          linked_profile_id: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          first_name: string
          last_name?: string | null
          family_role?: string | null
          photo_url?: string | null
          generation_id?: string | null
          parent_id?: string | null
          parent2_id?: string | null
          link_kind?: 'parent' | 'partner' | null
          relation_label?: string | null
          linked_profile_id?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          first_name?: string
          last_name?: string | null
          family_role?: string | null
          photo_url?: string | null
          generation_id?: string | null
          parent_id?: string | null
          parent2_id?: string | null
          link_kind?: 'parent' | 'partner' | null
          relation_label?: string | null
          linked_profile_id?: string | null
          created_by?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'family_members_family_id_fkey'
            columns: ['family_id']
            isOneToOne: false
            referencedRelation: 'families'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'family_members_generation_id_fkey'
            columns: ['generation_id']
            isOneToOne: false
            referencedRelation: 'family_generations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'family_members_parent_id_fkey'
            columns: ['parent_id']
            isOneToOne: false
            referencedRelation: 'family_members'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'family_members_parent2_id_fkey'
            columns: ['parent2_id']
            isOneToOne: false
            referencedRelation: 'family_members'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'family_members_linked_profile_id_fkey'
            columns: ['linked_profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'family_members_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      family_events: {
        Row: {
          id: string
          family_id: string
          title: string
          event_date: string
          note: string | null
          photo_url: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          title: string
          event_date: string
          note?: string | null
          photo_url?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          title?: string
          event_date?: string
          note?: string | null
          photo_url?: string | null
          created_by?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'family_events_family_id_fkey'
            columns: ['family_id']
            isOneToOne: false
            referencedRelation: 'families'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'family_events_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      event_recipes: {
        Row: {
          event_id: string
          recipe_id: string
        }
        Insert: {
          event_id: string
          recipe_id: string
        }
        Update: {
          event_id?: string
          recipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'event_recipes_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'family_events'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'event_recipes_recipe_id_fkey'
            columns: ['recipe_id']
            isOneToOne: false
            referencedRelation: 'recipes'
            referencedColumns: ['id']
          },
        ]
      }
      favorites: {
        Row: {
          user_id: string
          recipe_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          recipe_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          recipe_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'favorites_recipe_id_fkey'
            columns: ['recipe_id']
            isOneToOne: false
            referencedRelation: 'recipes'
            referencedColumns: ['id']
          },
        ]
      }
      family_waitlist: {
        Row: {
          id: string
          family_id: string
          created_by: string
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          created_by: string
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          created_by?: string
          note?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'family_waitlist_family_id_fkey'
            columns: ['family_id']
            isOneToOne: true
            referencedRelation: 'families'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'family_waitlist_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
